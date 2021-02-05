'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(t => {
      return Promise.all([
        queryInterface.addColumn('Games', 'playerLimit', {
          type: Sequelize.DataTypes.INTEGER
        })
      ])
    })
  },
  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(t => {
      return Promise.all([
        queryInterface.removeColumn('Games', 'playerLimit', { transaction: t }),
      ])
    })
  }
};
