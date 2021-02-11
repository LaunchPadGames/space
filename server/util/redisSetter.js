const { redisClient } = require('../redis')

module.exports = function(key, value){
  console.log('key: ', key)
  console.log('val: ', value)
  redisClient.set(key, JSON.stringify(value))
}