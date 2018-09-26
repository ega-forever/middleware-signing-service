/**
 * Copyright 2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Egor Zuev <zyev.egor@gmail.com>
 */

const signService = require('../services/tx/signService'),
  actionService = require('../services/tx/actionService'),
  clientValidationMiddleware = require('../middleware/clientValidationMiddleware');

module.exports = (router, wrapper)=>{

  router.post('/:blockchain/', clientValidationMiddleware, wrapper(signService));

  router.post('/:blockchain/:action', clientValidationMiddleware, wrapper(actionService));

};
