/**
 * Copyright 2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Egor Zuev <zyev.egor@gmail.com>
 */

const Sequelize = require('sequelize'),
  config = require('../config');

/**
 * @class Database
 * @description database instance (singleton)
 */
class Database {
  constructor () {
    this.instance = new Sequelize('main', null, null, {
      dialect: 'sqlite',
      storage: config.dbPath,
      logging: false
    });
  }

  get () {
    return this.instance;
  }

}

module.exports = new Database();
