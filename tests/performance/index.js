/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Egor Zuev <zyev.egor@gmail.com>
 */

require('dotenv/config');

const _ = require('lodash'),
  bip39 = require('bip39'),
  bitcoin = require('bitcoinjs-lib'),
  request = require('request-promise'),
  expect = require('chai').expect,
  Web3 = require('web3'),
  hdkey = require('ethereumjs-wallet/hdkey'),
  web3 = new Web3(),
  Promise = require('bluebird'),
  path = require('path'),
  fs = require('fs'),
  config = require('../../server/config'),
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
    try {
      ctx.server = spawn('node', [serverPath], {env: _.merge({}, process.env, {NETWORK: config.network, DB_URI: dbPath}), stdio: 'ignore'});
    }catch (e) {
      console.log(e)
    }

    ctx.client = web3.eth.accounts.create();
    ctx.client2 = web3.eth.accounts.create();

    await Promise.delay(5000);
  });


  it('generate 50 random mnemonics and save them', async () => {

    ctx.keys = [];

    for (let index = 0; index < 10; index++) {
      const item = {key: bip39.generateMnemonic()};

      if (index === 0)
        item.default = true;

      item.pubKeys = _.random(1 + index, 3);
      ctx.keys.push(item);
    }

    const start = Date.now();

    const token = await tokenLib.getUserToken(ctx.client.address.toString(), [config.auth.serviceId]);

    const keys = await request({
      uri: 'http://localhost:8080/keys',
      method: 'POST',
      json: ctx.keys,
      headers: {
        authorization: `Bearer ${token}`
      }
    });

    const totalDeriveKeysAmount = _.chain(ctx.keys)
      .map(key=>key.pubKeys)
      .flattenDeep()
      .sum()
      .value();

    expect(Date.now() - start).to.be.lt(2000 * totalDeriveKeysAmount);


    for (let item of ctx.keys) {

      const seed = bip39.mnemonicToSeed(item.key);
      let hdwallet = hdkey.fromMasterSeed(seed);
      const extendedPrivKey = hdwallet.privateExtendedKey();
      const privateKey = hdkey.fromExtendedKey(extendedPrivKey).getWallet().getPrivateKey();
      const account = web3.eth.accounts.privateKeyToAccount(privateKey);
      const address = account.address.toLowerCase();

      let key = _.find(keys, {address: address});

      for (let pubKey of key.pubKeys) {

        const ethPubKey = hdwallet.derivePath(`m/44'/60'/0'/0/${pubKey.index}`).getWallet().getPublicKey().toString('hex');
        const btcPubkey = bitcoin.HDNode.fromSeedBuffer(seed).derivePath('m/44\'/0\'/0\'').derivePath(`0/${pubKey.index}`).keyPair.getPublicKeyBuffer().toString('hex');
        expect(pubKey.eth === ethPubKey).to.eq(true);
        expect(pubKey.btc === btcPubkey).to.eq(true);
      }

      expect(key).to.not.eq(null);
    }


  });

  it('validate get keys route', async () => {

    const start = Date.now();

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
    expect(Date.now() - start).to.be.lt(500);

    for (let item of ctx.keys) {

      const seed = bip39.mnemonicToSeed(item.key);
      let hdwallet = hdkey.fromMasterSeed(seed);
      const extendedPrivKey = hdwallet.privateExtendedKey();
      const privateKey = hdkey.fromExtendedKey(extendedPrivKey).getWallet().getPrivateKey();
      const account = web3.eth.accounts.privateKeyToAccount(privateKey);
      const address = account.address.toLowerCase();

      let key = _.find(keys, {address: address});

      for (let pubKey of key.pubKeys) {

        const ethPubKey = hdwallet.derivePath(`m/44'/60'/0'/0/${pubKey.index}`).getWallet().getPublicKey().toString('hex');
        const btcPubkey = bitcoin.HDNode.fromSeedBuffer(seed).derivePath('m/44\'/0\'/0\'').derivePath(`0/${pubKey.index}`).keyPair.getPublicKeyBuffer().toString('hex');
        expect(pubKey.eth === ethPubKey).to.eq(true);
        expect(pubKey.btc === btcPubkey).to.eq(true);
      }

      expect(key).to.not.eq(null);
    }
  });


  after('kill environment', async () => {
    ctx.server.kill();
    await Promise.delay(5000);
  });


};
