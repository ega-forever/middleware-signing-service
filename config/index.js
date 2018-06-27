/**
 * Chronobank/waves-rest configuration
 * @module config
 * @returns {Object} Configuration
 * 
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Kirill Sergeev <cloudkserg11@gmail.com>
*/
require('dotenv').config();
const _ = require('lodash');

const getKeys = (addrKeys) => {
  return _.chain(addrKeys)
    .split(',')
    .reduce((output, addrKey) => {
      const data = addrKey.split('@');
      output[data[0].trim()] = data[1].trim(); 
      return output;
    }, {})
    .value();
};

const path = require('path'),
  signKeys = {
    nem: getKeys(process.env.NEM_KEY || ''),
    eth: getKeys(process.env.ETH_KEY || ''),
    bitcoin: getKeys(process.env.BITCOIN_KEY || ''),
    waves: getKeys(process.env.WAVES_SEED || '3JfE6tjeT7PnpuDQKxiVNLn4TJUFhuMaaT5@foo0') 
  },
  signingService = require('../services/signingService')(signKeys);

let config = {
  rest: {
    domain: process.env.DOMAIN || 'localhost',
    port: parseInt(process.env.REST_PORT) || 8081,
    auth: process.env.USE_AUTH || false
  }, 
  nodered: {
    uri: 'without mongo',
    useLocalStorage: true,
    autoSyncMigrations: process.env.NODERED_AUTO_SYNC_MIGRATIONS || true,
    customNodesDir: [path.join(__dirname, '../')],
    migrationsDir: path.join(__dirname, '../migrations'),
    migrationsInOneFile: true,
    httpAdminRoot: process.env.HTTP_ADMIN || false,
    functionGlobalContext: {
      libs: {
        signingService
      },
    }
  }
};


module.exports = config;
