const redis = require('redis');
const bluebird = require('bluebird')
bluebird.promisifyAll(redis)
const redisClient = redis.createClient(process.env.REDIS_URL);
const Queue = require('bull');

redisClient.on("error", function(error) {
  console.error(error);
});

module.exports = {
  redisClient,
  Queue
}