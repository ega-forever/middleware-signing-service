/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Egor Zuev <zyev.egor@gmail.com>
 */

require('dotenv/config');

const
  _ = require('lodash'),
  bip39 = require('bip39'),
  bitcoin = require('bitcoinjs-lib'),
  request = require('request-promise'),
  expect = require('chai').expect,
  Web3 = require('web3'),
  hdkey = require('ethereumjs-wallet/hdkey'),
  web3 = new Web3(),
  config = require('../../server/config'),
  Promise = require('bluebird'),
  btcTest = require('../features/btc'),
  ethTest = require('../features/eth'),
  path = require('path'),
  fs = require('fs'),
  BtcPlugin = require('../../server/plugins/BtcPlugin'),
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
    ctx.derivePurpose = {
      btc: new BtcPlugin(config.network).derivePurpose,
      eth: 60
    };



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

  it('add another client', async () => {

    ctx.client2 = {
      clientId: 'test_client2',
      clientName: 'test2'
    };

    const reply = await request({
      uri: 'http://localhost:8080/client',
      method: 'POST',
      json: ctx.client2
    });

    expect(reply.status).to.eq(1);
  });


  it('generate random mnemonics and save them', async () => {

    ctx.keys = [];

    for (let index = 0; index < 3; index++) {
      const item = {key: bip39.generateMnemonic()};

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

    expect(reply.status).to.eq(1);
  });

  it('generate random mnemonics and save them (account 2)', async () => {

    ctx.keys2 = [];

    for (let index = 0; index < 2; index++) {
      const item = {key: bip39.generateMnemonic()};

      if (index === 0)
        item.default = true;

      item.pubKeys = _.random(3, 5);
      ctx.keys2.push(item);
    }


    const reply = await request({
      uri: 'http://localhost:8080/keys',
      method: 'POST',
      json: ctx.keys2,
      headers: {
        client_id: ctx.client2.clientId
      }
    });

    expect(reply.status).to.eq(1);
  });

  it('validate get keys route (client one)', async () => {

    const keys = await request({
      uri: 'http://localhost:8080/keys',
      method: 'GET',
      json: true,
      headers: {
        client_id: ctx.client.clientId
      }
    });

    expect(keys.length).to.eq(ctx.keys.length);

    for (let item of ctx.keys) {

      const seed = bip39.mnemonicToSeed(item.key);
      let hdwallet = hdkey.fromMasterSeed(seed);
      const extendedPrivKey = hdwallet.privateExtendedKey();
      const privateKey = hdkey.fromExtendedKey(extendedPrivKey).getWallet().getPrivateKey();
      const account = web3.eth.accounts.privateKeyToAccount(privateKey);
      const address = account.address.toLowerCase();

      let key = _.find(keys, {address: address});

      for (let pubKey of key.pubKeys) {

        const ethPubKey = hdwallet.derivePath(`m/44'/${ctx.derivePurpose.eth}'/0'/0/${pubKey.index}`).getWallet().getPublicKey().toString('hex');
        const btcPuBkey = bitcoin.HDNode.fromSeedBuffer(seed).derivePath(`m/44'/${ctx.derivePurpose.btc}'/0'`).derivePath(`0/${pubKey.index}`).keyPair.getPublicKeyBuffer().toString('hex');
        expect(pubKey.eth === ethPubKey).to.eq(true);
        expect(pubKey.btc === btcPuBkey).to.eq(true);
      }

      expect(key).to.not.eq(null);
    }
  });

  it('validate get keys route (client two)', async () => {

    const keys = await request({
      uri: 'http://localhost:8080/keys',
      method: 'GET',
      json: true,
      headers: {
        client_id: ctx.client2.clientId
      }
    });

    expect(keys.length).to.eq(ctx.keys2.length);

    for (let item of ctx.keys2) {

      const seed = bip39.mnemonicToSeed(item.key);
      let hdwallet = hdkey.fromMasterSeed(seed);
      const extendedPrivKey = hdwallet.privateExtendedKey();
      const privateKey = hdkey.fromExtendedKey(extendedPrivKey).getWallet().getPrivateKey();
      const account = web3.eth.accounts.privateKeyToAccount(privateKey);
      const address = account.address.toLowerCase();

      let key = _.find(keys, {address: address});

      for (let pubKey of key.pubKeys) {

        const ethPubKey = hdwallet.derivePath(`m/44'/${ctx.derivePurpose.eth}'/0'/0/${pubKey.index}`).getWallet().getPublicKey().toString('hex');
        const btcPuBkey = bitcoin.HDNode.fromSeedBuffer(seed).derivePath(`m/44'/${ctx.derivePurpose.btc}'/0'`).derivePath(`0/${pubKey.index}`).keyPair.getPublicKeyBuffer().toString('hex');
        expect(pubKey.eth === ethPubKey).to.eq(true);
        expect(pubKey.btc === btcPuBkey).to.eq(true);
      }

      expect(key).to.not.eq(null);
    }
  });

  it('share key (from client 1 to client 2)', async () => {

    const keys = await request({
      uri: 'http://localhost:8080/keys',
      method: 'GET',
      json: true,
      headers: {
        client_id: ctx.client.clientId
      }
    });

    expect(keys.length).to.eq(ctx.keys.length);

    let sharedKey = _.find(keys, key => key.pubKeys.length > 2);

    const shareKeyResult = await request({
      uri: 'http://localhost:8080/keys',
      method: 'PUT',
      json: {
        address: sharedKey.address,
        share: 1,
        children: [0, 1],
        clientId: ctx.client2.clientId
      },
      headers: {
        client_id: ctx.client.clientId
      }
    });

    expect(shareKeyResult.status).to.eq(1);


    const newKeys = await request({
      uri: 'http://localhost:8080/keys',
      method: 'GET',
      json: true,
      headers: {
        client_id: ctx.client2.clientId
      }
    });

    let newSharedKey = _.find(newKeys, {address: sharedKey.address});

    expect(newSharedKey.pubKeys.length).to.eq(2);
  });

  describe('btc', () => btcTest(ctx));

  describe('eth', () => ethTest(ctx));

  after('kill environment', async () => {
    ctx.server.kill();
    await Promise.delay(5000);
  });


};
