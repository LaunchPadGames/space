const createPlayer = require('./createPlayer')
const createAsteroids = require('./createAsteroids')
const roomTagGenerator = require('./roomTagGenerator')
const roomTagParser = require('./roomTagParser')
const currentRoom = require('./currentRoom')
const redisGetter = require('./redisGetter')
const redisSetter = require('./redisSetter')

module.exports = {
  createPlayer,
  createAsteroids,
  roomTagGenerator,
  roomTagParser,
  currentRoom,
  redisGetter,
  redisSetter
}