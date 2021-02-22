const { redisClient } = require('../redis')

module.exports = function(key, value){
  redisClient.set(key, JSON.stringify(value))
}