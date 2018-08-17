const addClientService = require('../services/clients/addClientService'),
  deleteClientService = require('../services/clients/deleteClientService'),
  clientValidationMiddleware = require('../middleware/clientValidationMiddleware');

module.exports = (router, wrapper)=>{

  router.post('/', wrapper(addClientService));

  router.delete('/', clientValidationMiddleware, wrapper(deleteClientService));


};