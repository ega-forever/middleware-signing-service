const express = require('express'),
  bunyan = require('bunyan'),
  log = bunyan.createLogger({name: 'server.routes'}),
  messages = require('../factories/messages/genericMessages'),
  routes = require('require-all')({
    dirname: __dirname,
    filter: /(.+Route)\.js$/,
    map: name => name.replace('Route', '')
  });


const asyncMiddlewareWrapper = fn =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next))
      .catch(err => {
        log.error(err);
        res.send(messages.fail);
      });
  };

module.exports = (app) => {

  for (let path of Object.keys(routes)) {
    let router = express.Router();
    routes[path](router, asyncMiddlewareWrapper);
    app.use(`/${path}`, router);
  }

};