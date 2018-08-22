const requireAll = require('require-all'),
  _ = require('lodash'),
  AbstractPlugin = require('./abstract/AbstractPlugin'),
  plugins =  requireAll({
    dirname: __dirname,
    filter: /(.+Plugin)\.js$/,
    map: pluginName=> pluginName.replace('Plugin', '').toLowerCase()
  });

module.exports = _.chain(plugins).toPairs().filter(pair=> pair[1].prototype instanceof AbstractPlugin).fromPairs().value();