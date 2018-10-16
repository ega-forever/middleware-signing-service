/**
 * Copyright 2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Egor Zuev <zyev.egor@gmail.com>
 */

const Sequelize = require('sequelize');

/**
 * @model virtualKeyPubKeyModel
 * @description  sequilize model for keeping references between virtual private key and its public keys
 * @param sequelize - the sequelize instance
 * @return {*}
 */
module.exports = (sequelize) => {

  return sequelize.define('VirtualKeyPubKeys', {
    orderIndex: {
      type: Sequelize.INTEGER,
      allowNull: true
    },
  });

};
