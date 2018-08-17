/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Egor Zuev <zyev.egor@gmail.com>
 */

require('dotenv/config');

const keyring = require('bcoin/lib/primitives/keyring'),
  _ = require('lodash'),
  bip39 = require('bip39'),
  Client = require('../utils/bcoin/client'),
  request = require('request-promise'),
  client = new Client('http://localhost:18332'),
  expect = require('chai').expect,

  Promise = require('bluebird'),
  path = require('path'),
  fs = require('fs'),
  spawn = require('child_process').spawn;

module.exports = (ctx) => {

  before(async () => {

    const dbPath = path.join(__dirname, '../db.sql');
    try {
      fs.unlinkSync(dbPath);
    } catch (e) {

    }

    ctx.server = spawn('node', ['src/server/index.js'], {env: {NETWORK: 'regtest', DB_PATH: dbPath}, stdio: 'ignore'});
    await Promise.delay(5000);
  });

  it('add client', async () => {

    ctx.client = {
      clientId: 'test_client',
      clientName: 'test'
    };

    const reply = await request({
      uri: 'http://localhost:8080/client',
      method: 'POST',
      json: ctx.client
    });


    expect(reply.status).to.eq(1);
  });


  it('generate random mnemonics and save them', async () => {

    const payload = [];
    ctx.mnemonis = [];

    for (let index = 0; index < 3; index++) {

      const mnemonic = bip39.generateMnemonic();
      const item = {key: mnemonic};
      ctx.mnemonis.push(mnemonic);

      if (index === 0)
        item.default = true;

      item.pubKeys = _.random(1, 20);
    }


    const reply = await request({
      uri: 'http://localhost:8080/keys',
      method: 'POST',
      json: payload,
      headers: {
        client_id: ctx.client.clientId
      }
    });

    console.log(reply)

    expect(reply.status).to.eq(1);

  });

  it('generate some coins for accountB', async () => {
    let key = new keyring(ctx.keyPair2);
    return await client.execute('generatetoaddress', [100, key.getAddress('base58', ctx.network)])
  });

  it('generate some coins for accountA (in order to unlock coins for accountB)', async () => {
    let key = new keyring(ctx.keyPair);
    return await client.execute('generatetoaddress', [100, key.getAddress('base58', ctx.network)])
  });

  after('kill environment', async () => {
    ctx.server.kill();
  });


};
