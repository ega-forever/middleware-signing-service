const bunyan = require('bunyan'),
  _ = require('lodash'),
  log = bunyan.createLogger({name: 'server.middleware.logActionMiddleware'});

module.exports = async (req, res, next) => {

  if (new RegExp(/\/keys/).test(req.originalUrl) && req.method === 'POST') {

    let payload = _.chain(_.isArray(req.body) ? req.body : [req.body]).cloneDeep().map(item => {
      item.key = 'xxx';
      return item;
    }).value();

    log.info(`endpoint: ${req.method} ${req.originalUrl} with params ${JSON.stringify(payload)}`);
    return next();
  }

  log.info(`endpoint: ${req.method} ${req.originalUrl} with params ${JSON.stringify(req.body)}`);
  next();
};
