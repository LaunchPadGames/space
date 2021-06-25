const { Player } = require('../../models')
const { redisGetter, redisSetter } = require('../util');

class CreatePlayer{
  constructor(roomTag, game, socket){
    this.roomTag = roomTag
    this.game = game
    this.socket = socket
  }

  async run(){
    await Player.create({socketId: this.socket.id, gameId: this.game.dataValues.id})
  }

  async playersCount(){
    await Player.count({ where: { gameId: this.game.dataValues.id } })
  }
}

module.exports.CreatePlayer = CreatePlayer