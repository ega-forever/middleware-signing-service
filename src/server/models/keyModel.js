const Sequelize = require('sequelize');

module.exports = (sequelize) => {

  return sequelize.define('Keys', {
    clientId: {
      type: Sequelize.STRING
    },
    address: {
      type: Sequelize.STRING,
      primaryKey: true
    },
    privateKey: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
    },
    pubKeysCount: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    isStageChild: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    default: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    derivePath: {
      type: Sequelize.STRING
    },
  });

};
