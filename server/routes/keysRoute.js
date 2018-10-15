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
  logActionMiddleware = require('../middleware/logActionMiddleware'),
  updateKeysService = require('../services/keys/updateKeysService'),
  updateVirtualKeysService = require('../services/keys/updateVirtualKeysService'),
  clientValidationMiddleware = require('../middleware/clientValidationMiddleware');

module.exports = (router, wrapper)=>{

  router.get('/', clientValidationMiddleware, logActionMiddleware, wrapper(getKeysService));

  router.post('/', clientValidationMiddleware, logActionMiddleware, wrapper(setKeysService));

  router.post('/virtual', clientValidationMiddleware, logActionMiddleware, wrapper(setVirtualKeysService));

  router.put('/', clientValidationMiddleware, logActionMiddleware, wrapper(updateKeysService));

  router.put('/virtual', clientValidationMiddleware, logActionMiddleware, wrapper(updateVirtualKeysService));

  router.delete('/', clientValidationMiddleware, logActionMiddleware, wrapper(deleteKeysService));

  router.delete('/virtual', clientValidationMiddleware, logActionMiddleware, wrapper(deleteVirtualKeysService));

};
