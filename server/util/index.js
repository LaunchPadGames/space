const createPlayer = require('./createPlayer')
const createAsteroids = require('./createAsteroids')
const tagGenerator = require('./tagGenerator')
const roomTagParser = require('./roomTagParser')
const currentRoom = require('./currentRoom')
const redisGetter = require('./redisGetter')
const redisSetter = require('./redisSetter')
const sprayQueue = require('./sprayQueue')

module.exports = {
  createPlayer,
  createAsteroids,
  tagGenerator,
  roomTagParser,
  currentRoom,
  redisGetter,
  redisSetter,
  sprayQueue
}