'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(t => {
      return Promise.all([
        queryInterface.addColumn('Games', 'gameType', {
          type: Sequelize.DataTypes.INTEGER
        })
      ])
    })
  },
  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(t => {
      return Promise.all([
        queryInterface.removeColumn('Games', 'gameType', { transaction: t }),
      ])
    })
  }
};
