const { redisClient } = require('../redis')

module.exports = async function(key){
  const value = await redisClient.getAsync(key)
  return JSON.parse(value)
}