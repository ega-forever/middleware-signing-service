'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    queryInterface.addColumn('Keys', 'isVirtual', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
    );

    queryInterface.addColumn('Keys', 'requiredCount', {
      type: Sequelize.INTEGER,
      allowNull: true
    }
    );

  },

  down: (queryInterface) => {
    queryInterface.removeColumn('Keys', 'isVirtual');
    queryInterface.removeColumn('Keys', 'requiredCount');
  }
};
