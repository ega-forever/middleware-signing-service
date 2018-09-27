/**
 * Copyright 2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Egor Zuev <zyev.egor@gmail.com>
 */

const Sequelize = require('sequelize');


/**
 * @model clientModel
 * @description  sequilize client model. Represents the registered clients
 * @param sequelize - the sequelize instance
 * @return {*}
 */
module.exports = (sequelize) => {

  return sequelize.define('Clients', {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    clientId: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
    },
    clientName: {
      type: Sequelize.STRING
    }
  });


};
