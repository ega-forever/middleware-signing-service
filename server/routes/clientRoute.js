/**
 * Copyright 2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Egor Zuev <zyev.egor@gmail.com>
 */

const addClientService = require('../services/clients/addClientService'),
  deleteClientService = require('../services/clients/deleteClientService'),
  logActionMiddleware = require('../middleware/logActionMiddleware'),
  clientValidationMiddleware = require('../middleware/clientValidationMiddleware');

module.exports = (router, wrapper)=>{

  router.post('/', logActionMiddleware, wrapper(addClientService));

  router.delete('/', clientValidationMiddleware, wrapper(deleteClientService));


};
