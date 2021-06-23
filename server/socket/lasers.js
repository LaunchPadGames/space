const { redisSetter, redisGetter } = require('../util');

module.exports = (socket, room) => {
  socket.on('laserShot', async function(data) {
    redisGame = await redisGetter(room)
    if (redisGame['players'][socket.id] == null) return;
    let laser = data;
    data.owner_id = socket.id;
    socket.to(room).broadcast.emit('laserUpdate', laser, socket.id)
  })
}