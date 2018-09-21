const addClientService = require('../services/clients/addClientService'),
  deleteClientService = require('../services/clients/deleteClientService'),
  logActionMiddleware = require('../middleware/logActionMiddleware'),
  clientValidationMiddleware = require('../middleware/clientValidationMiddleware');

module.exports = (router, wrapper)=>{

  router.post('/', logActionMiddleware, wrapper(addClientService));

  router.delete('/', clientValidationMiddleware, wrapper(deleteClientService));


};
