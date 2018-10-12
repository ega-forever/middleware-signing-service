/**
 * Copyright 2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Egor Zuev <zyev.egor@gmail.com>
 */

const Sequelize = require('sequelize'),
  Umzug = require('umzug'),
  path = require('path'),
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
      logging: true
    });
  }

  get () {
    return this.instance;
  }

  async runMigrations () {

    const umzug = new Umzug({
      storage: 'sequelize',

      storageOptions: {
        sequelize: this.instance
      },

      migrations: {
        params: [
          this.instance.getQueryInterface(),
          Sequelize
        ],
        path: path.join(__dirname, '../migrations')
      }
    });

    return await umzug.up();
  }

}

module.exports = new Database();
