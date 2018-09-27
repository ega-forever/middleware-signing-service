/**
 * Copyright 2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Egor Zuev <zyev.egor@gmail.com>
 */

const Sequelize = require('sequelize');


/**
 * @model pubKeyModel
 * @description  sequilize pubKey model. Represents the public keys collection,
 * derived from master private key (KeyModel)
 * @param sequelize - the sequelize instance
 * @return {*}
 */
module.exports = (sequelize) => {

  return sequelize.define('PubKeys', {
    pubKey: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: 'compositeIndex'
    },
    blockchain: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: 'compositeIndex'
    },
    index: {
      type: Sequelize.INTEGER,
      allowNull: false
    }
  });

};
