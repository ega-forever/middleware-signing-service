const setKeysService = require('../services/keys/setKeysService'),
  deleteKeysService = require('../services/keys/deleteKeysService'),
  getKeysService = require('../services/keys/getKeysService'),
  updateKeysService = require('../services/keys/updateKeysService');

module.exports = (router, wrapper)=>{

  router.get('/', wrapper(getKeysService));

  router.post('/', wrapper(setKeysService));

  router.put('/', wrapper(updateKeysService));

  router.delete('/', wrapper(deleteKeysService));

};