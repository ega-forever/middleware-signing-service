const Sequelize = require('sequelize'),
  config = require('../config');

class Database {
  constructor() {
    this.instance = new Sequelize('main', null, null, {
      dialect: 'sqlite',
      storage: config.dbPath,
    });
  }

  get() {
    return this.instance;
  }

}

module.exports = new Database();
