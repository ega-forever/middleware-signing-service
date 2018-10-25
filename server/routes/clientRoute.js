/**
 * Copyright 2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Egor Zuev <zyev.egor@gmail.com>
 */

const addClientService = require('../services/clients/addClientService'),
  deleteClientService = require('../services/clients/deleteClientService'),
  logActionMiddleware = require('../middleware/logActionMiddleware'),
  clientValidationMiddleware = require('../middleware/clientValidationMiddleware'),
  config = require('../config'),
  lib = require('middleware_auth_lib'),
  auth = lib.authMiddleware({
    serviceId: config.auth.serviceId,
    provider: config.auth.provider
  });


module.exports = (router, wrapper) => {

  router.use(auth);

  router.post('/', logActionMiddleware, wrapper(addClientService));

  router.delete('/', clientValidationMiddleware, wrapper(deleteClientService));


};
