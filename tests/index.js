/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Egor Zuev <zyev.egor@gmail.com>
 */

require('dotenv/config');
process.env.LOG_LEVEL = 'error';

const bcoin = require('bcoin'),
  spawn = require('child_process').spawn,
  //fuzzTests = require('./fuzz'),
  //performanceTests = require('./performance'),
  featuresTests = require('./features'),
  Network = require('bcoin/lib/protocol/network'),
  //blockTests = require('./blocks'),
  Promise = require('bluebird'),
  ctx = {};


describe('singing service', function () {

  before(async () => {
    ctx.network = Network.get('regtest');
    ctx.keyPair = bcoin.hd.generate(ctx.network);
    ctx.keyPair2 = bcoin.hd.generate(ctx.network);

    ctx.nodePid = spawn('node', ['tests/utils/bcoin/node.js'], {env: process.env, stdio: 'inherit'});
    await Promise.delay(10000);
  });

  after(async () => {
    ctx.nodePid.kill();
  });


  //describe('block', () => blockTests(ctx));

  //describe('performance', () => performanceTests(ctx));

  //describe('fuzz', () => fuzzTests(ctx));

  describe('features', () => featuresTests(ctx));

});
