const infoService = require('../services/info/infoService');

module.exports = (router) => {

  router.get('/', infoService);

};
