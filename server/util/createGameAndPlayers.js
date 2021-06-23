const { Game, Player } = require('../../models')
const redisGetter = require('./redisGetter')
const redisSetter = require('./redisSetter')

module.exports = async function(roomTag, allowedPlayersCount, socket) {
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

  return [currentPlayersCount, playerLimit]
}