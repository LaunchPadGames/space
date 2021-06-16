const { 
  createPlayer, 
  createAsteroids, 
  tagGenerator,
  roomTagParser,
  currentRoom,
  redisSetter,
  redisGetter
} = require('../util');
const { Game, Player } = require('../../models')

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
      redisSetter(roomTag, {'players': {}, 'asteroids': {}, 'time': 300, 'intervalId': null, 'powerups': {}})
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
      let redisGame = await redisGetter(room)
      redisGame['players'][socket.id] = createPlayer(socket, currentPlayersCount)
      console.log('player: ', redisGame['players'])
      await redisSetter(room, redisGame)
      
      // send the players object to the new player
      socket.emit('currentPlayers', redisGame['players']);

      // update all other players of the new player
      socket.to(room).broadcast.emit('newPlayer', redisGame['players'][socket.id]);
      if (currentPlayersCount !== playerLimit) {
        socket.emit('waitingForPlayers', { roomTag, time: redisGame['time'] });
      } else {
        const asteroidData = createAsteroids()
        redisGame = await redisGetter(room)
        redisGame['asteroids'] = asteroidData['asteroidHash']
        let intervalId = setInterval(async function(){
          let redisGame = await redisGetter(room)
          if(redisGame['time'] === 0) clearInterval(redisGame['intervalId'])
          redisGame['time'] = redisGame['time'] - 1
          redisSetter(room, redisGame)
          io.sockets.in(room).emit('updateTimer', redisGame['time']);
        }, 1000)
        redisGame['intervalId'] = intervalId[Symbol.toPrimitive]()
        redisSetter(room, redisGame)
        io.sockets.in(room).emit('createAsteroids', asteroidData['asteroidArray'])
      }
      socket.on('disconnect', async function () {
        console.log('user disconnected');
        // remove this player from our players object
        redisGame = await redisGetter(room)
        delete redisGame['players'][socket.id]
        redisSetter(room, redisGame)
        // delete players[room][socket.id];
        // emit a message to all players to remove this player
        io.sockets.in(room).emit('disconnect', socket.id);
      });
      socket.on('playerMovement', async function(movementData){
        redisGame = await redisGetter(room)
        redisGame['players'][socket.id].x = movementData.x
        redisGame['players'][socket.id].y = movementData.y
        redisGame['players'][socket.id].rotation = movementData.rotation
        redisSetter(room, redisGame)
        socket.to(room).broadcast.emit('playerMoved', redisGame['players'][socket.id])
      })

      socket.on('laserShot', async function(data) {
        redisGame = await redisGetter(room)
        if (redisGame['players'][socket.id] == null) return;
        let laser = data;
        data.owner_id = socket.id;
        socket.to(room).broadcast.emit('laserUpdate', laser, socket.id)
      })
      socket.on('destroyAsteroid', async function(data){
        let laser = data['laser']
        let asteroidIndex = data['asteroidIndex']
        redisGame = await redisGetter(room)
        if(laser && redisGame['asteroids'][asteroidIndex]){
          redisGame['players'][socket.id]['score'] += 10
        }
        redisGame['asteroids'][asteroidIndex] = false
        redisSetter(room, redisGame)
        socket.to(room).broadcast.emit('broadcastDestoryAsteroid', asteroidIndex)
        io.sockets.in(room).emit('updateScore', {socketId: socket.id, score: redisGame['players'][socket.id]['score']})

        if(laser){
          let powerupNum = Math.floor(Math.random() * 100)
          if(powerupNum >= 60 && powerupNum < 70){
            let powerupId = tagGenerator()
            redisGame['powerups'][powerupId] = true
            redisSetter(room, redisGame)
            io.sockets.in(room).emit('updatePowerups', {id: powerupId, x: data['x'], y: data['y'], type: 'silver_powerup'})
          } if(powerupNum >= 70 && powerupNum < 80){
            let powerupId = tagGenerator()
            redisGame['powerups'][powerupId] = true
            redisSetter(room, redisGame)
            io.sockets.in(room).emit('updatePowerups', {id: powerupId, x: data['x'], y: data['y'], type: 'gold_powerup'})
          } if(powerupNum >= 80 && powerupNum < 90){
            let powerupId = tagGenerator()
            redisGame['powerups'][powerupId] = true
            redisSetter(room, redisGame)
            io.sockets.in(room).emit('updatePowerups', {id: powerupId, x: data['x'], y: data['y'], type: 'star_powerup'})
          } if (powerupNum > 90) {
            let powerupId = tagGenerator()
            redisGame['powerups'][powerupId] = true
            redisSetter(room, redisGame)
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
        redisGame = await redisGetter(room)
        console.log('Powerup Type: ', type)
        if(redisGame['powerups'][powerupId]){
          redisGame['powerups'][powerupId] = false
          redisSetter(room, redisGame)
          if(type === 'shield_powerup'){
            console.log('Shield Powerup')
            console.log('room: ', room)
            io.sockets.in(room).emit('shieldPowerUp', {powerupId: powerupId, texture: 'ship_shield1', level: 2, playerId: socket.id})
          } else if(type === 'silver_powerup'){
            io.sockets.in(room).emit('silverPowerup', {powerupId: powerupId, playerId: socket.id})
            let timeoutObject = setTimeout(async function() {
              let redisGame = await redisGetter(room)
              let timeoutId = redisGame['players'][socket.id]['powerups']['rateOfFire'] 
              if(timeoutId === this[Symbol.toPrimitive]()){
                io.sockets.in(room).emit('silverPowerupOff', {playerId: socket.id})
              }
            }, 5000);
            if(!redisGame['players'][socket.id]['powerups']){
              redisGame['players'][socket.id]['powerups'] = {}
            }
            redisGame['players'][socket.id]['powerups']['rateOfFire'] = timeoutObject[Symbol.toPrimitive]()
            redisSetter(room, redisGame)
          } else if(type === 'gold_powerup'){
            io.sockets.in(room).emit('goldPowerup', {powerupId: powerupId, playerId: socket.id})
            let timeoutObject = setTimeout(async function() {
              let redisGame = await redisGetter(room)
              let timeoutId = redisGame['players'][socket.id]['powerups']['spray'] 
              if(timeoutId === this[Symbol.toPrimitive]()){
                io.sockets.in(room).emit('goldPowerupOff', {playerId: socket.id})
              }
            }, 5000);
            if(!redisGame['players'][socket.id]['powerups']){
              redisGame['players'][socket.id]['powerups'] = {}
            }
            redisGame['players'][socket.id]['powerups']['spray'] = timeoutObject[Symbol.toPrimitive]()
            redisSetter(room, redisGame)
          } else {
            io.sockets.in(room).emit('starPowerup', {powerupId: powerupId, playerId: socket.id})
            let timeoutObject = setTimeout(async function() {
              let redisGame = await redisGetter(room)
              let timeoutId = redisGame['players'][socket.id]['powerups']['speed'] 
              if(timeoutId === this[Symbol.toPrimitive]()){
                io.sockets.in(room).emit('starPowerupOff', {playerId: socket.id})
              }
            }, 5000);
            if(!redisGame['players'][socket.id]['powerups']){
              redisGame['players'][socket.id]['powerups'] = {}
            } 
            redisGame['players'][socket.id]['powerups']['speed'] = timeoutObject[Symbol.toPrimitive]()
            redisSetter(room, redisGame)
          }
        }
      })
    }
  })
};