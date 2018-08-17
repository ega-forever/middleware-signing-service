const setKeysService = require('../services/keys/setKeysService'),
  deleteKeysService = require('../services/keys/deleteKeysService'),
  getKeysService = require('../services/keys/getKeysService'),
  clientValidationMiddleware = require('../middleware/clientValidationMiddleware');

module.exports = (router, wrapper)=>{

  router.get('/', clientValidationMiddleware, wrapper(getKeysService));

  router.post('/', clientValidationMiddleware, wrapper(setKeysService));

  router.delete('/', clientValidationMiddleware, wrapper(deleteKeysService));

};