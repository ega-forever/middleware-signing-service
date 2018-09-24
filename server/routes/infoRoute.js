const infoService = require('../services/info/infoService'),
  logActionMiddleware = require('../middleware/logActionMiddleware');

module.exports = (router) => {

  router.get('/', logActionMiddleware, infoService);

};
