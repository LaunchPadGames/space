const { redisSetter, redisGetter } = require('../util');

module.exports = (io, socket, room, roomTag) => {
  socket.on('shieldUpdate', function(data){
    socket.to(room).broadcast.emit('shieldUpdateOtherPlayers', data)
  })

  socket.on('destroyPowerup', async function(powerupId, type){
    redisGame = await redisGetter(roomTag)
    console.log('Powerup Type: ', type)
    if(redisGame['powerups'][powerupId]){
      redisGame['powerups'][powerupId] = false
      redisSetter(roomTag, redisGame)
      if(type === 'shield_powerup'){
        console.log('Shield Powerup')
        io.sockets.in(room).emit('shieldPowerUp', {powerupId: powerupId, texture: 'ship_shield1', level: 2, playerId: socket.id})
      } 
      if(type === 'silver_powerup'){
        io.sockets.in(room).emit('silverPowerup', {powerupId: powerupId, playerId: socket.id})
        let timeoutObject = setTimeout(async function() {
          let redisGame = await redisGetter(roomTag)
          let timeoutId = redisGame['players'][socket.id]['powerups']['rateOfFire'] 
          if(timeoutId === this[Symbol.toPrimitive]()){
            io.sockets.in(room).emit('silverPowerupOff', {playerId: socket.id})
          }
        }, 5000);
        if(!redisGame['players'][socket.id]['powerups']){
          redisGame['players'][socket.id]['powerups'] = {}
        }
        redisGame['players'][socket.id]['powerups']['rateOfFire'] = timeoutObject[Symbol.toPrimitive]()
        redisSetter(roomTag, redisGame)
      } 
      if(type === 'gold_powerup'){
        io.sockets.in(room).emit('goldPowerup', {powerupId: powerupId, playerId: socket.id})
        let timeoutObject = setTimeout(async function() {
          let redisGame = await redisGetter(roomTag)
          let timeoutId = redisGame['players'][socket.id]['powerups']['spray'] 
          if(timeoutId === this[Symbol.toPrimitive]()){
            io.sockets.in(room).emit('goldPowerupOff', {playerId: socket.id})
          }
        }, 5000);
        if(!redisGame['players'][socket.id]['powerups']){
          redisGame['players'][socket.id]['powerups'] = {}
        }
        redisGame['players'][socket.id]['powerups']['spray'] = timeoutObject[Symbol.toPrimitive]()
        redisSetter(roomTag, redisGame)
      } 
      if(type === 'star_powerup'){
        io.sockets.in(room).emit('starPowerup', {powerupId: powerupId, playerId: socket.id})
        let timeoutObject = setTimeout(async function() {
          let redisGame = await redisGetter(roomTag)
          let timeoutId = redisGame['players'][socket.id]['powerups']['speed'] 
          if(timeoutId === this[Symbol.toPrimitive]()){
            io.sockets.in(room).emit('starPowerupOff', {playerId: socket.id})
          }
        }, 5000);
        if(!redisGame['players'][socket.id]['powerups']){
          redisGame['players'][socket.id]['powerups'] = {}
        } 
        console.log('type before speed bug: ', type)
        redisGame['players'][socket.id]['powerups']['speed'] = timeoutObject[Symbol.toPrimitive]()
        redisSetter(roomTag, redisGame)
      }
    }
  })
}