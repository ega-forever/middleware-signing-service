/** 
* Copyright 2017–2018, LaborX PTY
* Licensed under the AGPL Version 3 license.
* @author Kirill Sergeev <cloudkserg11@gmail.com>
*/

const config = require('./config'),
  path = require('path'),
  migrator = require('middleware_service.sdk').migrator,
  redInitter = require('middleware_service.sdk').init;


const init = async () => {

  if (config.nodered.autoSyncMigrations)
    await migrator.run(config.nodered.uri, path.join(__dirname, 'migrations'), '_migrations', config.nodered.useLocalStorage);

  redInitter(config);
};

module.exports = init();
