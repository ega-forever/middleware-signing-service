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
  nemTest = require('../features/nem'),
  wavesTest = require('../features/waves'),
  path = require('path'),
  fs = require('fs'),
  BtcPlugin = require('../../server/plugins/BtcPlugin'),
  spawn = require('child_process').spawn,
  lib = require('middleware_auth_lib'),
  tokenLib = new lib.Token({
    id: config.auth.serviceId,
    provider: config.auth.provider,
    secret: '123'
  });

module.exports = (ctx) => {

  before(async () => {

    const dbPath = path.join(__dirname, '../db.sql');
    try {
      fs.unlinkSync(dbPath);
    } catch (e) {
    }

    const serverPath = path.join(__dirname, '../../server/index.js');
    ctx.server = spawn('node', [serverPath], {
      env: _.merge({}, process.env, {NETWORK: config.network, DB_URI: dbPath}),
      stdio: 'inherit'
    });
    ctx.derivePurpose = {
      btc: new BtcPlugin(config.network).derivePurpose,
      eth: 60,
      nem: 43,
      waves: 0
    };

    ctx.client = web3.eth.accounts.create();
    ctx.client2 = web3.eth.accounts.create();


    await Promise.delay(5000);
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

    const token = await tokenLib.getUserToken(ctx.client.address.toString(), [config.auth.serviceId]);

    const keys = await request({
      uri: 'http://localhost:8080/keys',
      method: 'POST',
      json: ctx.keys,
      headers: {
        authorization: `Bearer ${token}`
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


  it('generate random mnemonics and save them (account 2)', async () => {

    ctx.keys2 = [];

    for (let index = 0; index < 2; index++) {
      const item = {key: bip39.generateMnemonic()};

      if (index === 0)
        item.default = true;

      item.pubKeys = _.random(3, 5);
      ctx.keys2.push(item);
    }


    const token = await tokenLib.getUserToken(ctx.client2.address.toString(), [config.auth.serviceId]);

    const keys = await request({
      uri: 'http://localhost:8080/keys',
      method: 'POST',
      json: ctx.keys2,
      headers: {
        authorization: `Bearer ${token}`
      }
    });


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

  it('validate get keys route (client one)', async () => {


    const token = await tokenLib.getUserToken(ctx.client.address.toString(), [config.auth.serviceId]);

    const keys = await request({
      uri: 'http://localhost:8080/keys',
      method: 'GET',
      json: true,
      headers: {
        authorization: `Bearer ${token}`
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

  it('validate get single keys route (client one)', async () => {

    const seed = bip39.mnemonicToSeed(ctx.keys[0].key);
    let hdwallet = hdkey.fromMasterSeed(seed);
    const extendedPrivKey = hdwallet.privateExtendedKey();
    const privateKey = hdkey.fromExtendedKey(extendedPrivKey).getWallet().getPrivateKey();
    const account = web3.eth.accounts.privateKeyToAccount(privateKey);
    const address = account.address.toLowerCase();


    const token = await tokenLib.getUserToken(ctx.client.address.toString(), [config.auth.serviceId]);

    const key = await request({
      uri: `http://localhost:8080/keys/${address}`,
      method: 'GET',
      json: true,
      headers: {
        authorization: `Bearer ${token}`
      }
    });

    for (let pubKey of key.pubKeys) {

      const ethPubKey = hdwallet.derivePath(`m/44'/${ctx.derivePurpose.eth}'/0'/0/${pubKey.index}`).getWallet().getPublicKey().toString('hex');
      const btcPuBkey = bitcoin.HDNode.fromSeedBuffer(seed).derivePath(`m/44'/${ctx.derivePurpose.btc}'/0'`).derivePath(`0/${pubKey.index}`).keyPair.getPublicKeyBuffer().toString('hex');
      expect(pubKey.eth === ethPubKey).to.eq(true);
      expect(pubKey.btc === btcPuBkey).to.eq(true);
    }

    expect(key).to.not.eq(null);

  });

  it('validate key generation on server side (client one)', async () => {

    let toGenerate = _.chain(new Array(3)).fill(0)
      .map((item, index) => ({
        pubKeys: _.random(1 + index, 7),
        info: `generated_${index}`
      }))
      .value();

    ctx.keys.push(...toGenerate);


    const token = await tokenLib.getUserToken(ctx.client.address.toString(), [config.auth.serviceId]);


    const keys = await request({
      uri: 'http://localhost:8080/keys/generate',
      method: 'POST',
      json: toGenerate,
      headers: {
        authorization: `Bearer ${token}`
      }
    });

    expect(keys.length).to.eq(toGenerate.length);

    let generatedKeys = _.filter(key => key.info.includes('generated'));

    for (let generatedKey of generatedKeys) {
      let generateOptions = _.find(toGenerate, {info: generatedKey.info});
      expect(generatedKey.pubKeys.length).to.eq(generateOptions.pubKeys)
    }


  });

  it('validate get keys route (client two)', async () => {

    const token = await tokenLib.getUserToken(ctx.client2.address.toString(), [config.auth.serviceId]);

    const keys = await request({
      uri: 'http://localhost:8080/keys',
      method: 'GET',
      json: true,
      headers: {
        authorization: `Bearer ${token}`
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

    const token = await tokenLib.getUserToken(ctx.client.address.toString(), [config.auth.serviceId]);

    const keys = await request({
      uri: 'http://localhost:8080/keys',
      method: 'GET',
      json: true,
      headers: {
        authorization: `Bearer ${token}`
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
        clientId: ctx.client2.address.toString()
      },
      headers: {
        authorization: `Bearer ${token}`
      }
    });

    expect(shareKeyResult.status).to.eq(1);


    const token2 = await tokenLib.getUserToken(ctx.client2.address.toString(), [config.auth.serviceId]);

    const newKeys = await request({
      uri: 'http://localhost:8080/keys',
      method: 'GET',
      json: true,
      headers: {
        authorization: `Bearer ${token2}`
      }
    });

    let newSharedKey = _.find(newKeys, {address: sharedKey.address});

    expect(newSharedKey.pubKeys.length).to.eq(2);
  });


  describe('btc', () => btcTest(ctx));

 // describe('eth', () => ethTest(ctx));

/*  describe('nem', () => nemTest(ctx));

  describe('waves', () => wavesTest(ctx));*/

  after('kill environment', async () => {
    ctx.server.kill();
    await Promise.delay(5000);
  });


};
