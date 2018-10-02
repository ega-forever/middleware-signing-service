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
  ctx = {};


describe('signing service', function () {


 // describe('block', () => blockTests(ctx));

 // describe('performance', () => performanceTests(ctx));

 // describe('fuzz', () => fuzzTests(ctx));

  describe('features', () => featuresTests(ctx));

});
