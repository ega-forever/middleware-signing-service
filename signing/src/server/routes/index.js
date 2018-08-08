const express = require('express'),
  routes = require('require-all')({
    dirname: __dirname,
    filter: /(.+Route)\.js$/,
    map: name => name.replace('Route', '')
  });


const asyncMiddlewareWrapper = fn =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next))
      .catch(next);
  };

module.exports = (app) => {

  for (let path of Object.keys(routes)) {
    let router = express.Router();
    routes[path](router, asyncMiddlewareWrapper);
    app.use(`/${path}`, router);
  }

};