const Sequelize = require('sequelize');
const db = require('../db');

module.exports = db.define('player', {
  username: {
    type: Sequelize.STRING,
  },
  score: {
    type: Sequelize.INTEGER
  },
  socketId: {
    type: Sequelize.STRING,
    allowNull: false
  },
  gameId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: Sequelize.Game,
      key: 'id'
    }
  }
});