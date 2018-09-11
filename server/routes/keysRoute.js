const setKeysService = require('../services/keys/setKeysService'),
  deleteKeysService = require('../services/keys/deleteKeysService'),
  getKeysService = require('../services/keys/getKeysService'),
  logActionMiddleware = require('../middleware/logActionMiddleware'),
  updateKeysService = require('../services/keys/updateKeysService'),
  clientValidationMiddleware = require('../middleware/clientValidationMiddleware');

module.exports = (router, wrapper)=>{

  router.get('/', clientValidationMiddleware, logActionMiddleware, wrapper(getKeysService));

  router.post('/', clientValidationMiddleware, logActionMiddleware, wrapper(setKeysService));

  router.put('/', clientValidationMiddleware, logActionMiddleware, wrapper(updateKeysService));

  router.delete('/', clientValidationMiddleware, logActionMiddleware, wrapper(deleteKeysService));

};