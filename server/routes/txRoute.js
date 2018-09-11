const signService = require('../services/tx/signService'),
  actionService = require('../services/tx/actionService'),
  clientValidationMiddleware = require('../middleware/clientValidationMiddleware');

module.exports = (router, wrapper)=>{

  router.post('/:blockchain/', clientValidationMiddleware, wrapper(signService));

  router.post('/:blockchain/:action', clientValidationMiddleware, wrapper(actionService));

};
