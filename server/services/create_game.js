const { Game } = require('../../models')
const { redisGetter, redisSetter } = require('../util');

console.log('Game: ', Game)
class CreateGame {
  constructor(roomTag, allowedPlayersCount){
    this.roomTag = roomTag
    this.allowedPlayersCount = allowedPlayersCount
  }

  async run() {
    this.game = await Game.findOrCreate({
      where: { roomTag: this.roomTag},
      defaults: { roomTag: this.roomTag, playerLimit: this.allowedPlayersCount}
    });

    await this.setRedisGame()
    return this.game[0]
  }

  async setRedisGame() {
    if(!(await redisGetter(roomTag)) ){
      redisSetter(roomTag, {'players': {}, 'asteroids': {}, 'time': 300, 'intervalId': null, 'powerups': {}})
    } 
  }
}

console.log('CreateGame: ', CreateGame)
module.exports.CreateGame = CreateGame