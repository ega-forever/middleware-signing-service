/**
 * Copyright 2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Egor Zuev <zyev.egor@gmail.com>
 */

const signService = require('../services/tx/signService'),
  actionService = require('../services/tx/actionService'),
  clientValidationMiddleware = require('../middleware/clientValidationMiddleware'),
  config = require('../config'),
  lib = require('middleware_auth_lib'),
  auth = lib.authMiddleware({
    serviceId: config.auth.serviceId,
    provider: config.auth.provider
  });

module.exports = (router, wrapper)=>{

  router.use(auth);

  router.post('/:blockchain/', clientValidationMiddleware, wrapper(signService));

  router.post('/:blockchain/:action', clientValidationMiddleware, wrapper(actionService));

};
