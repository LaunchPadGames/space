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
    if(!global.global.game_cache){
      global.game_cache = new GameCache()
    } 

    await Player.create({socketId: socket.id, gameId: game.dataValues.id})
    socket.join(roomTag)

    let currentPlayersCount = await Player.count({
      where: { gameId: game.dataValues.id }
    })

    const playerLimit = game.dataValues.playerLimit
    if (currentPlayersCount > playerLimit) {
      socket.emit('inProgress');
    } else {
      console.log('a user connected');
      const room = currentRoom(io, socket)
      global.game_cache['players'][socket.id] = createPlayer(socket, currentPlayersCount)
      socket.emit('currentPlayers', global.game_cache['players']);

      // update all other players of the new player
      socket.to(room).broadcast.emit('newPlayer', global.game_cache['players'][socket.id]);
      if (currentPlayersCount !== playerLimit) {
        redisSetter(roomTag, global.game_cache)
        let base_url = process.env.BASE_URL || 'http://localhost:3000'
        
        socket.emit('waitingForPlayers', { roomTag: roomTag, time: global.game_cache['time'], baseUrl: base_url });
      } else {
        const asteroidData = createAsteroids()
        // redisGame = await redisGetter(room)
        global.game_cache['asteroids'] = asteroidData['asteroidHash']
        let time = global.game_cache['time']
        let intervalId = setInterval(async function(){
          if(time === 0) clearInterval(global.game_cache['intervalId'])
          time = time - 1
          io.sockets.in(room).emit('updateTimer', time);
        }, 1000)
        global.game_cache['intervalId'] = intervalId[Symbol.toPrimitive]()
        io.sockets.in(room).emit('createAsteroids', asteroidData['asteroidArray'])
      }
      socket.on('disconnect', async function () {
        console.log('user disconnected');
        delete global.game_cache['players'][socket.id]
        io.sockets.in(room).emit('disconnect', socket.id);
      });
      socket.on('playerMovement', async function(movementData){
        global.game_cache['players'][socket.id].x = movementData.x
        global.game_cache['players'][socket.id].y = movementData.y
        global.game_cache['players'][socket.id].rotation = movementData.rotation
        socket.to(room).broadcast.emit('playerMoved', global.game_cache['players'][socket.id])
      })

      socket.on('laserShot', async function(data) {
        if (global.game_cache['players'][socket.id] == null) return;
        let laser = data;
        data.owner_id = socket.id;
        socket.to(room).broadcast.emit('laserUpdate', laser, socket.id)
      })
      socket.on('destroyAsteroid', async function(data){
        let laser = data['laser']
        let asteroidIndex = data['asteroidIndex']
        if(laser && global.game_cache['asteroids'][asteroidIndex]){
          global.game_cache['players'][socket.id]['score'] += 10
        }
        global.game_cache['asteroids'][asteroidIndex] = false
        socket.to(room).broadcast.emit('broadcastDestoryAsteroid', asteroidIndex)
        io.sockets.in(room).emit('updateScore', {socketId: socket.id, score: global.game_cache['players'][socket.id]['score']})

        if(laser){
          let powerupNum = Math.floor(Math.random() * 100)
           if(powerupNum > 50 && powerupNum < 76){
            let powerupId = tagGenerator()
            global.game_cache['powerups'][powerupId] = true
            io.sockets.in(room).emit('updatePowerups', {id: powerupId, x: data['x'], y: data['y'], type: 'gold_powerup'})
          } if (powerupNum > 76) {
            let powerupId = tagGenerator()
            global.game_cache['powerups'][powerupId] = true
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
        console.log('power up: ', powerupId)
        console.log('type: ', type)
        console.log("global.game_cache: ", global.game_cache)
        console.log("global.game_cache['powerups'][powerupId]: ", global.game_cache['powerups'][powerupId])
        if(global.game_cache['powerups'][powerupId]){
          global.game_cache['powerups'][powerupId] = false
          if(type === 'shield_powerup'){
            io.sockets.in(room).emit('shieldPowerUp', {powerupId: powerupId, texture: 'ship_shield1', level: 2, playerId: socket.id})
          } 
          if(type === 'silver_powerup'){
            io.sockets.in(room).emit('silverPowerup', {powerupId: powerupId, playerId: socket.id})
            let timeoutObject = setTimeout(async function() {
              // let redisGame = await redisGetter(room)
              let timeoutId = global.game_cache['players'][socket.id]['powerups']['rateOfFire'] 
              if(timeoutId === this[Symbol.toPrimitive]()){
                io.sockets.in(room).emit('silverPowerupOff', {playerId: socket.id})
              }
            }, 5000);
            global.game_cache['players'][socket.id]['powerups']['rateOfFire'] = timeoutObject[Symbol.toPrimitive]()
          } 
          if(type === 'gold_powerup'){
            let spray_queue = global.game_cache['players'][socket.id]['powerups']['spray_queue']
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
              let timeoutId = global.game_cache['players'][socket.id]['powerups']['speed'] 
              if(timeoutId === this[Symbol.toPrimitive]()){
                io.sockets.in(room).emit('starPowerupOff', {playerId: socket.id})
              }
            }, 5000);
            global.game_cache['players'][socket.id]['powerups']['speed'] = timeoutObject[Symbol.toPrimitive]()
          }
        }
      })
    }
  })
};