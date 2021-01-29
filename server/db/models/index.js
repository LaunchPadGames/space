const Game = require('./game');
const Player = require('./player');

Game.hasMany(Player);
Player.belongsTo(Game);

module.exports = {
  Game,
  Player
};