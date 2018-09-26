/**
 * Copyright 2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Egor Zuev <zyev.egor@gmail.com>
 */

const infoService = require('../services/info/infoService'),
  logActionMiddleware = require('../middleware/logActionMiddleware');

module.exports = (router) => {

  router.get('/', logActionMiddleware, infoService);

};
