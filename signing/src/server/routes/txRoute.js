const signService = require('../services/tx/signService'),
  clientValidationMiddleware = require('../middleware/clientValidationMiddleware');

module.exports = (router, wrapper)=>{

  router.post('/:blockchain/', clientValidationMiddleware, wrapper(signService));


};