/**
 * Copyright 2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Egor Zuev <zyev.egor@gmail.com>
 */

const setKeysService = require('../services/keys/setKeysService'),
  deleteKeysService = require('../services/keys/deleteKeysService'),
  deleteVirtualKeysService = require('../services/keys/deleteVirtualKeysService'),
  setVirtualKeysService = require('../services/keys/setVirtualKeysService'),
  getKeysService = require('../services/keys/getKeysService'),
  generateKeysService = require('../services/keys/generateKeysService'),
  logActionMiddleware = require('../middleware/logActionMiddleware'),
  updateKeysService = require('../services/keys/updateKeysService'),
  updateVirtualKeysService = require('../services/keys/updateVirtualKeysService'),
  clientValidationMiddleware = require('../middleware/clientValidationMiddleware'),
  config = require('../config'),
  lib = require('middleware_auth_lib'),
  auth = lib.authMiddleware({
    serviceId: config.auth.serviceId,
    provider: config.auth.provider
  });

module.exports = (router, wrapper) => {

  router.use(auth);

  router.get('/', clientValidationMiddleware, logActionMiddleware, wrapper(getKeysService));

  router.get('/:address', clientValidationMiddleware, logActionMiddleware, wrapper(getKeysService));

  router.post('/', clientValidationMiddleware, logActionMiddleware, wrapper(setKeysService), wrapper(getKeysService));

  router.post('/generate', clientValidationMiddleware, logActionMiddleware, generateKeysService, wrapper(setKeysService), wrapper(getKeysService));

  router.post('/virtual', clientValidationMiddleware, logActionMiddleware, wrapper(setVirtualKeysService), wrapper(getKeysService));

  router.put('/', clientValidationMiddleware, logActionMiddleware, wrapper(updateKeysService));

  router.put('/virtual', clientValidationMiddleware, logActionMiddleware, wrapper(updateVirtualKeysService));

  router.delete('/', clientValidationMiddleware, logActionMiddleware, wrapper(deleteKeysService));

  router.delete('/virtual', clientValidationMiddleware, logActionMiddleware, wrapper(deleteVirtualKeysService));

};
