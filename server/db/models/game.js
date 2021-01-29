const Sequelize = require('sequelize');
const db = require('../db');

module.exports = db.define('game', {
  roomTag: {
    type: Sequelize.STRING,
    allowNull: false
  },
});