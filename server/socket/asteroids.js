const { 
  tagGenerator, 
  redisSetter, 
  redisGetter 
} = require('../util');

module.exports = (io, socket, room) => {
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
        if(powerupNum >= 80 && powerupNum < 90){
        let powerupId = tagGenerator()
        redisGame['powerups'][powerupId] = true
        redisSetter(room, redisGame)
        io.sockets.in(room).emit('updatePowerups', {id: powerupId, x: data['x'], y: data['y'], type: 'gold_powerup'})
      } if (powerupNum > 90) {
        let powerupId = tagGenerator()
        redisGame['powerups'][powerupId] = true
        redisSetter(room, redisGame)
        io.sockets.in(room).emit('updatePowerups', {id: powerupId, x: data['x'], y: data['y'], type: 'shield_powerup'})
      }
    }
  });
}