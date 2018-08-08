const setKeysService = require('../services/keys/setKeysService'),
  deleteKeysService = require('../services/keys/deleteKeysService'),
  getKeysService = require('../services/keys/getKeysService');

module.exports = (router, wrapper)=>{

  router.get('/', wrapper(getKeysService));

  router.post('/', wrapper(setKeysService));

  router.delete('/', wrapper(deleteKeysService));

};