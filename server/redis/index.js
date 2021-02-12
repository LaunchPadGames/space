const redis = require('redis');
const bluebird = require('bluebird')
bluebird.promisifyAll(redis)
const redisClient = redis.createClient();

redisClient.on("error", function(error) {
  console.error(error);
});

module.exports = {
  redisClient
}