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

    const dbPath = path.join(__dirname, '../db.sql');
    try {
      fs.unlinkSync(dbPath);
    } catch (e) {

    }

    const serverPath = path.join(__dirname, '../../server/index.js');
    ctx.server = spawn('node', [serverPath], {env: _.merge({}, process.env, {NETWORK: config.network, DB_URI: dbPath}), stdio: 'ignore'});
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

  it('try to save bad mnemonic', async () => {

    ctx.keys = [];

    for (let index = 0; index < 3; index++) {
      const item = {key: bip39.generateMnemonic() + bip39.generateMnemonic()};

      if (index === 0)
        item.default = true;

      item.pubKeys = _.random(1 + index, 20);
      ctx.keys.push(item);
    }


    const reply = await request({
      uri: 'http://localhost:8080/keys',
      method: 'POST',
      json: ctx.keys,
      headers: {
        client_id: ctx.client.clientId
      }
    });

    expect(reply.status).to.eq(200);
  });


  it('try to save bad private key', async () => {

    const reply = await request({
      uri: 'http://localhost:8080/keys',
      method: 'POST',
      json: {
        key: _.chain(new Array(32)).fill(1).join('').value()
      },
      headers: {
        client_id: ctx.client.clientId
      }
    });

    expect(reply.status).to.eq(200);
  });

  it('validate get keys route', async () => {

    const keys = await request({
      uri: 'http://localhost:8080/keys',
      method: 'GET',
      json: true,
      headers: {
        client_id: ctx.client.clientId
      }
    });

    expect(keys.length).to.eq(0);
  });


  it('save 2 private keys', async () => {

    const keys = [
      {key: '6b9027372deb53f4ae973a5614d8a57024adf33126ece6b587d9e08ba901c0d2'},
      {key: '993130d3dd4de71254a94a47fdacb1c9f90dd33be8ad06b687bd95f073514a97'}
    ];

    ctx.keys.push(...keys);

    const reply = await request({
      uri: 'http://localhost:8080/keys',
      method: 'POST',
      json: keys,
      headers: {
        client_id: ctx.client.clientId
      }
    });

    expect(reply.status).to.eq(1);
  });

  it('validate get keys route', async () => {

    const keys = await request({
      uri: 'http://localhost:8080/keys',
      method: 'GET',
      json: true,
      headers: {
        client_id: ctx.client.clientId
      }
    });

    expect(keys.length).to.eq(2);
  });

  it('can\'t sign transaction for eth with wrong signer address', async () => {

    const keyA = '0x7af5f0d70d97f282dfd20a9b611a2e4bd40572c038a89c0ee171a3c93bd6a17a';

    const account = web3.eth.accounts.privateKeyToAccount(keyA);
    const address = account.address.toLowerCase();

    const rawTx = {
      nonce: web3.utils.toHex(0),
      gasPrice: web3.utils.toHex(web3.utils.toWei('20', 'gwei')),
      gasLimit: web3.utils.toHex(100000),
      to: address,
      from: address,
      value: web3.utils.toHex(Math.pow(10, 16) + '')
    };

    const reply = await request({
      uri: 'http://localhost:8080/tx/eth',
      method: 'POST',
      json: {
        signers: [address],
        payload: rawTx
      },
      headers: {
        client_id: ctx.client.clientId
      }
    });

    expect(reply.status).to.eq(301);
  });

  it('can\'t stage non extended private key', async () => {

    const keyA = '0x7af5f0d70d97f282dfd20a9b611a2e4bd40572c038a89c0ee171a3c93bd6a17a';

    const keys = await request({
      uri: 'http://localhost:8080/keys',
      method: 'GET',
      json: true,
      headers: {
        client_id: ctx.client.clientId
      }
    });

    const account = web3.eth.accounts.privateKeyToAccount(keyA);
    const address = account.address.toLowerCase();


    const stageKeyResult = await request({
      uri: 'http://localhost:8080/keys',
      method: 'PUT',
      json: {
        address: address,
        incrementChild: 1
      },
      headers: {
        client_id: ctx.client.clientId
      }
    });

    expect(stageKeyResult.status).to.eq(201);

    const newKeys = await request({
      uri: 'http://localhost:8080/keys',
      method: 'GET',
      json: true,
      headers: {
        client_id: ctx.client.clientId
      }
    });

    expect(_.isEqual(keys, newKeys)).to.eq(true);

  });

  it('can\'t delete non existent private key', async () => {

    const keyA = '0x7af5f0d70d97f282dfd20a9b611a2e4bd40572c038a89c0ee171a3c93bd6a17a';

    const keys = await request({
      uri: 'http://localhost:8080/keys',
      method: 'GET',
      json: true,
      headers: {
        client_id: ctx.client.clientId
      }
    });

    const account = web3.eth.accounts.privateKeyToAccount(keyA);
    const address = account.address.toLowerCase();


    const deleteKeyResult = await request({
      uri: 'http://localhost:8080/keys',
      method: 'DELETE',
      json: {
        address: address
      },
      headers: {
        client_id: ctx.client.clientId
      }
    });

    expect(deleteKeyResult.status).to.eq(200);

    const newKeys = await request({
      uri: 'http://localhost:8080/keys',
      method: 'GET',
      json: true,
      headers: {
        client_id: ctx.client.clientId
      }
    });

    expect(_.isEqual(keys, newKeys)).to.eq(true);

  });


  after('kill environment', async () => {
    ctx.server.kill();
    await Promise.delay(5000);
  });

};
