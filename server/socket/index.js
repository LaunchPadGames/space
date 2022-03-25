const { 
  createPlayer, 
  createAsteroids, 
  tagGenerator,
  roomTagParser,
  currentRoom,
  redisSetter,
  redisGetter,
} = require('../util');
const { Game, Player } = require('../../models')
const {PowerupQueue} = require('../powerup_queue.js')
const {GameCache} = require('../game_cache.js')

module.exports = io => {
  io.on('connection', async function (socket) {
    const roomTag = roomTagParser(socket) || tagGenerator()
    const allowedPlayersCount = parseInt(socket.handshake.query.allowedPlayersCount)
    let games = await Game.findOrCreate({
      where: { roomTag: roomTag},
      defaults: { roomTag: roomTag, playerLimit: allowedPlayersCount}
    });
    let game = games[0]
    if(!(await redisGetter(roomTag)) ){
      let game_cache = new GameCache()
      redisSetter(roomTag, game_cache)
    } 

    await Player.create({socketId: socket.id, gameId: game.dataValues.id})
    socket.join(roomTag)

    let currentPlayersCount = await Player.count({
      where: { gameId: game.dataValues.id }
    })

    let game_cache =  await redisGetter(roomTag)
    const playerLimit = game.dataValues.playerLimit
    if (currentPlayersCount > playerLimit) {
      socket.emit('inProgress');
    } else {
      console.log('a user connected');
      const room = currentRoom(io, socket)
      // let redisGame = await redisGetter(room)
      // redisGame['players'][socket.id] = createPlayer(socket, currentPlayersCount)
      game_cache['players'][socket.id] = createPlayer(socket, currentPlayersCount)
      // console.log('player: ', redisGame['players'])
      // await redisSetter(room, redisGame)
      
      // send the players object to the new player
      socket.emit('currentPlayers', game_cache['players']);

      // update all other players of the new player
      socket.to(room).broadcast.emit('newPlayer', game_cache['players'][socket.id]);
      if (currentPlayersCount !== playerLimit) {
        redisSetter(roomTag, game_cache)
        let base_url = process.env.BASE_URL || 'http://localhost:3000'
        
        socket.emit('waitingForPlayers', { roomTag: roomTag, time: game_cache['time'], baseUrl: base_url });
      } else {
        const asteroidData = createAsteroids()
        // redisGame = await redisGetter(room)
        game_cache['asteroids'] = asteroidData['asteroidHash']
        let time = game_cache['time']
        let intervalId = setInterval(async function(){
          if(time === 0) clearInterval(game_cache['intervalId'])
          time = time - 1
          io.sockets.in(room).emit('updateTimer', time);
        }, 1000)
        game_cache['intervalId'] = intervalId[Symbol.toPrimitive]()
        io.sockets.in(room).emit('createAsteroids', asteroidData['asteroidArray'])
      }
      socket.on('disconnect', async function () {
        console.log('user disconnected');
        // remove this player from our players object
        // redisGame = await redisGetter(room)
        delete game_cache['players'][socket.id]
        // redisSetter(room, redisGame)
        // delete players[room][socket.id];
        // emit a message to all players to remove this player
        io.sockets.in(room).emit('disconnect', socket.id);
      });
      socket.on('playerMovement', async function(movementData){
        // redisGame = await redisGetter(room)
        game_cache['players'][socket.id].x = movementData.x
        game_cache['players'][socket.id].y = movementData.y
        game_cache['players'][socket.id].rotation = movementData.rotation
        // redisSetter(room, redisGame)
        socket.to(room).broadcast.emit('playerMoved', game_cache['players'][socket.id])
      })

      socket.on('laserShot', async function(data) {
        // redisGame = await redisGetter(room)
        if (game_cache['players'][socket.id] == null) return;
        let laser = data;
        data.owner_id = socket.id;
        socket.to(room).broadcast.emit('laserUpdate', laser, socket.id)
      })
      socket.on('destroyAsteroid', async function(data){
        let laser = data['laser']
        let asteroidIndex = data['asteroidIndex']
        // redisGame = await redisGetter(room)
        if(laser && game_cache['asteroids'][asteroidIndex]){
          game_cache['players'][socket.id]['score'] += 10
        }
        game_cache['asteroids'][asteroidIndex] = false
        // redisSetter(room, redisGame)
        socket.to(room).broadcast.emit('broadcastDestoryAsteroid', asteroidIndex)
        io.sockets.in(room).emit('updateScore', {socketId: socket.id, score: game_cache['players'][socket.id]['score']})

        if(laser){
          let powerupNum = Math.floor(Math.random() * 100)
           if(powerupNum > 50 && powerupNum < 76){
            let powerupId = tagGenerator()
            game_cache['powerups'][powerupId] = true
            // redisSetter(room, redisGame)
            io.sockets.in(room).emit('updatePowerups', {id: powerupId, x: data['x'], y: data['y'], type: 'gold_powerup'})
          } if (powerupNum > 76) {
            let powerupId = tagGenerator()
            game_cache['powerups'][powerupId] = true
            // redisSetter(room, redisGame)
            io.sockets.in(room).emit('updatePowerups', {id: powerupId, x: data['x'], y: data['y'], type: 'shield_powerup'})
          }
        }

      });
      socket.on('disablePlayer', function(socketId){
        socket.to(room).broadcast.emit('disableOtherPlayer', socketId)
      })
      socket.on('enablePlayer', function(socketId){
        socket.to(room).broadcast.emit('enableOtherPlayer', socketId)
      })
      socket.on('shieldUpdate', function(data){
        socket.to(room).broadcast.emit('shieldUpdateOtherPlayers', data)
      })
      socket.on('destroyPowerup', async function(powerupId, type){
        // redisGame = await redisGetter(room)
        console.log('power up: ', powerupId)
        console.log('type: ', type)
        console.log("game_cache: ", game_cache)
        console.log("game_cache['powerups'][powerupId]: ", game_cache['powerups'][powerupId])
        if(game_cache['powerups'][powerupId]){
          game_cache['powerups'][powerupId] = false
          // redisSetter(room, redisGame)
          if(type === 'shield_powerup'){
            io.sockets.in(room).emit('shieldPowerUp', {powerupId: powerupId, texture: 'ship_shield1', level: 2, playerId: socket.id})
          } 
          if(type === 'silver_powerup'){
            io.sockets.in(room).emit('silverPowerup', {powerupId: powerupId, playerId: socket.id})
            let timeoutObject = setTimeout(async function() {
              // let redisGame = await redisGetter(room)
              let timeoutId = game_cache['players'][socket.id]['powerups']['rateOfFire'] 
              if(timeoutId === this[Symbol.toPrimitive]()){
                io.sockets.in(room).emit('silverPowerupOff', {playerId: socket.id})
              }
            }, 5000);
            // if(!redisGame['players'][socket.id]['powerups']){
            //   redisGame['players'][socket.id]['powerups'] = {}
            // }
            game_cache['players'][socket.id]['powerups']['rateOfFire'] = timeoutObject[Symbol.toPrimitive]()
            // redisSetter(room, redisGame)
          } 
          if(type === 'gold_powerup'){
            let spray_queue = game_cache['players'][socket.id]['powerups']['spray_queue']
            spray_queue.enqueue(powerupId)
            io.sockets.in(room).emit('goldPowerup', {powerupId: powerupId, playerId: socket.id})
              if(spray_queue.size === 1){
                let sprayIntervalId = setInterval(async function(){
                  spray_queue.dequeue()
                  if(spray_queue.size === 0){
                    io.sockets.in(room).emit('goldPowerupOff', {playerId: socket.id})
                    clearInterval(sprayIntervalId)
                  }
                }, 5000)
            }
          } 
          if(type === 'star_powerup'){
            io.sockets.in(room).emit('starPowerup', {powerupId: powerupId, playerId: socket.id})
            let timeoutObject = setTimeout(async function() {
              // let redisGame = await redisGetter(room)
              let timeoutId = game_cache['players'][socket.id]['powerups']['speed'] 
              if(timeoutId === this[Symbol.toPrimitive]()){
                io.sockets.in(room).emit('starPowerupOff', {playerId: socket.id})
              }
            }, 5000);
            // if(!redisGame['players'][socket.id]['powerups']){
            //   redisGame['players'][socket.id]['powerups'] = {}
            // } 
            game_cache['players'][socket.id]['powerups']['speed'] = timeoutObject[Symbol.toPrimitive]()
            // redisSetter(room, redisGame)
          }
        }
      })
    }
  })
};