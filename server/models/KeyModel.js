/**
 * Copyright 2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Egor Zuev <zyev.egor@gmail.com>
 */

const Sequelize = require('sequelize');


/**
 * @model keyModel
 * @description  sequilize key model. Represents the registered keys of the clients
 * @param sequelize - the sequelize instance
 * @return {*}
 */
module.exports = (sequelize) => {

  return sequelize.define('Keys', {
    address: {
      type: Sequelize.STRING,
      allowNull: false
    },
    privateKey: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: false
    },
    info: {
      type: Sequelize.STRING,
      allowNull: true
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
    isVirtual: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    requiredCount: {
      type: Sequelize.INTEGER,
      allowNull: true
    },
    default: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  },
  {
    indexes: [
      {unique: true, fields: ['ClientId', 'address']}
    ]
  });

};
