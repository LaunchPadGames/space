const Sequelize = require('sequelize');
const db = require('../db');

module.exports = db.define('Game', {
  roomTag: {
    type: Sequelize.STRING,
    allowNull: false
  },
});