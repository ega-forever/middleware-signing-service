/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Egor Zuev <zyev.egor@gmail.com>
 */

require('dotenv/config');

const
  _ = require('lodash'),
  bip39 = require('bip39'),
  request = require('request-promise'),
  expect = require('chai').expect,
  Web3 = require('web3'),
  web3 = new Web3(),
  Promise = require('bluebird'),
  path = require('path'),
  config = require('../../server/config'),
  fs = require('fs'),
  spawn = require('child_process').spawn;

module.exports = (ctx) => {

  before(async () => {
  });


};
