const { 
  redisSetter, 
  redisGetter 
} = require('../util');

module.exports = (socket, room) => {
  socket.on('playerMovement', async function(movementData){
    redisGame = await redisGetter(room)
    redisGame['players'][socket.id].x = movementData.x
    redisGame['players'][socket.id].y = movementData.y
    redisGame['players'][socket.id].rotation = movementData.rotation
    redisSetter(room, redisGame)
    socket.to(room).broadcast.emit('playerMoved', redisGame['players'][socket.id])
  })

  socket.on('disablePlayer', function(socketId){
    socket.to(room).broadcast.emit('disableOtherPlayer', socketId)
  })
  socket.on('enablePlayer', function(socketId){
    socket.to(room).broadcast.emit('enableOtherPlayer', socketId)
  })
}