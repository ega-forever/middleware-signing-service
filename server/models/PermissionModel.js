/**
 * Copyright 2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Egor Zuev <zyev.egor@gmail.com>
 */

const Sequelize = require('sequelize');

/**
 * @model permissionModel
 * @description  sequilize permission model. Represents the client-key ownership permissions
 * @param sequelize - the sequelize instance
 * @return {*}
 */
module.exports = (sequelize) => {

  return sequelize.define('Permissions', {
    deriveIndex: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    owner: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  });

};
