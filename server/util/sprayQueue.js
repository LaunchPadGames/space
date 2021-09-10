const { Queue } = require('../redis')
const sprayQueue = new Queue('spray queue', 'redis://127.0.0.1:6379');
sprayQueue.process(function(job, done){
  try {
    console.log('Start Queue')
    const data = job.data
    console.log('data: ', data)
    data.turnOnPowerup()
    setTimeout(function() {
      data.turnOffPowerup()
    }, 5000);
  
    console.log('End Queue')
    done();
  } catch(error){
    console.log('Error: ', error)
  }
})

module.exports = function(io, room, socket, powerupId){
  let turnOnPowerup = function(){
    console.log('turn on powerup')
    io.sockets.in(room).emit('goldPowerup', {powerupId: powerupId, playerId: socket.id})
  }

  let turnOffPowerup = function(){
    console.log('turn off powerup')
    io.sockets.in(room).emit('goldPowerupOff', {playerId: socket.id})
  }
  console.log('turnOnPowerup: ', turnOnPowerup)
  console.log('turnOffPowerup: ', turnOffPowerup)
  sprayQueue.add({turnOnPowerup: 'turnOnPowerup', turnOffPowerup: 'turnOffPowerup'})
}