require('dotenv').config();

const path = require('path');

module.exports = {
  dbPath:  process.env.DB_URI ? path.isAbsolute(process.env.DB_URI) ? path.normalize(process.env.DB_URI) : path.join(__dirname, '../../', process.env.DB_URI) : path.join(__dirname, '../../db.sqlite'),
  network: process.env.NETWORK || 'testnet',
  rest: {
    port: parseInt(process.env.REST_PORT) || 8080
  }
};
