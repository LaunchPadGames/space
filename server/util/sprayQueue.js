const { Queue } = require('../redis')
const sprayQueue = new Queue('spray queue', 'redis://127.0.0.1:6379');
sprayQueue.process(function(job, done){
  const data = job.data
  const io = data.io
  const socket = data.socket
  // const 
  setTimeout(function() {
    io.sockets.in(room).emit('goldPowerupOff', {playerId: socket.id})
  }, 5000);
})

module.exports = async function(job, done){
  sprayQueue
}