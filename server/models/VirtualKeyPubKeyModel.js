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

  return sequelize.define('VirtualKeyPubKeys', {
  });

};
