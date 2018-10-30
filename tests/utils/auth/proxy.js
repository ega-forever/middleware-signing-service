/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Kirill Sergeev <cloudkserg11@gmail.com>
 */
const express = require('express'),
  URL = require('url').URL,
  jwt = require('jsonwebtoken'),
  uniqid = require('uniqid'),
  config = require('../../../server/config');

const app = express();

app.use(express.json());

const uri = new URL(config.auth.provider);

// respond with "hello world" when a GET request is made to the homepage
app.post('/tokens', function (req, res) {

  let token = jwt.sign({
    clientId: req.body.id,
    scopes: req.body.scopes,
    type: 'client',
    data: uniqid()
  }, '123', {expiresIn: 86400});

  let refreshToken = jwt.sign({
    clientId: req.body.id,
    scopes: req.body.scopes,
    type: 'client',
    data: uniqid()
  }, '123', {expiresIn: 86400});

  res.send({
    ok: true,
    token,
    refreshToken
  });
});

app.post('/user/tokens', function (req, res) {

  const tokenData =  jwt.verify(req.body.token, '123');

  let token = jwt.sign({
    clientId: tokenData.clientId,
    userId: req.body.userId,
    scopes: req.body.scopes,
    type: 'user',
    data: uniqid()
  }, '123', {expiresIn: 86400});

  let refreshToken = jwt.sign({
    clientId: tokenData.clientId,
    userId: req.body.userId,
    scopes: req.body.scopes,
    type: 'user',
    data: uniqid()
  }, '123', {expiresIn: 86400});

  res.send({
    ok: true,
    token,
    refreshToken
  });

});

app.get('/user/tokens/check', function (req, res) {
  res.send({ok: true});
});

app.listen(uri.port);



