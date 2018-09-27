/**
 * Copyright 2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Egor Zuev <zyev.egor@gmail.com>
 */

require('dotenv').config();
const path = require('path');

/**
 * @factory config
 * @description base app's configuration
 * @type {{
 *    dbPath: string,
 *    network: (
 *        services|Number|string),
 *        rest: {port: number
 *        }
 *    }}
 */
module.exports = {
  dbPath:  process.env.DB_URI ? path.isAbsolute(process.env.DB_URI) ? path.normalize(process.env.DB_URI) : path.join(__dirname, '../../', process.env.DB_URI) : path.join(__dirname, '../../db.sqlite'),
  network: process.env.NETWORK || 'regtest',
  rest: {
    port: parseInt(process.env.REST_PORT) || 8080
  }
};
