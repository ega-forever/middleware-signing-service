/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Egor Zuev <zyev.egor@gmail.com>
 */

require('dotenv/config');

const btcTest = require('./btc');

module.exports = (ctx) => {

  before(async () => {
  });

  describe('btc', () => btcTest(ctx));

};
