/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Egor Zuev <zyev.egor@gmail.com>
 */

require('dotenv/config');
process.env.LOG_LEVEL = 'error';

const fuzzTests = require('./fuzz'),
  performanceTests = require('./performance'),
  featuresTests = require('./features'),
  blockTests = require('./block'),
  path = require('path'),
  spawn = require('child_process').spawn,
  ctx = {};


describe('signing service', function () {

  before(async () => {

    const proxyPath = path.join(__dirname, 'utils/auth/proxy.js');
    ctx.server = spawn('node', [proxyPath], {
      env: process.env,
      stdio: 'inherit'
    });

  });

  describe('block', () => blockTests(ctx));

  describe('performance', () => performanceTests(ctx));

  describe('fuzz', () => fuzzTests(ctx));

  describe('features', () => featuresTests(ctx));

});
