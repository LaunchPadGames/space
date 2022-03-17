const {PowerupQueue} = require('./powerup_queue.js')

class GameCache {
  constructor(){
    this.players = {};
    this.asteroids = {}; 
    this.time = 300, 
    this.intervalId = null;
    this.powerups = {}
  }
}

module.exports = {
  GameCache
}