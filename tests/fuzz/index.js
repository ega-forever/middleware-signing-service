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
  Wallet = require('ethereumjs-wallet'),
  Promise = require('bluebird'),
  path = require('path'),
  config = require('../../server/config'),
  fs = require('fs'),
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
    ctx.server = spawn('node', [serverPath], {env: _.merge({}, process.env, {NETWORK: config.network, DB_URI: dbPath}), stdio: 'ignore'});

    ctx.client = web3.eth.accounts.create();
    ctx.client2 = web3.eth.accounts.create();

    await Promise.delay(5000);
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

    const token = await tokenLib.getUserToken(ctx.client.address.toString(), [config.auth.serviceId]);


    const reply = await request({
      uri: 'http://localhost:8080/keys',
      method: 'POST',
      json: ctx.keys,
      headers: {
        authorization: `Bearer ${token}`
      }
    });

    expect(reply.status).to.eq(200);
  });

  it('try to save bad private key', async () => {

    const token = await tokenLib.getUserToken(ctx.client.address.toString(), [config.auth.serviceId]);

    const reply = await request({
      uri: 'http://localhost:8080/keys',
      method: 'POST',
      json: {
        key: _.chain(new Array(32)).fill(1).join('').value()
      },
      headers: {
        authorization: `Bearer ${token}`
      }
    });

    expect(reply.status).to.eq(200);
  });

  it('validate get keys route', async () => {

    const token = await tokenLib.getUserToken(ctx.client.address.toString(), [config.auth.serviceId]);

    const keys = await request({
      uri: 'http://localhost:8080/keys',
      method: 'GET',
      json: true,
      headers: {
        authorization: `Bearer ${token}`
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

    const token = await tokenLib.getUserToken(ctx.client.address.toString(), [config.auth.serviceId]);


    const keys2 = await request({
      uri: 'http://localhost:8080/keys',
      method: 'POST',
      json: keys,
      headers: {
        authorization: `Bearer ${token}`
      }
    });


    for (let item of keys) {

      if (item.key.length <= 66) {
        const privateKey = item.key.indexOf('0x') === 0 ? item.key : `0x${item.key}`;
        const account = web3.eth.accounts.privateKeyToAccount(privateKey);
        const address = account.address.toLowerCase();

        let key = _.find(keys2, {address: address});
        for (let pubKey of key.pubKeys) {
          const ethPubKey = Wallet.fromPrivateKey(Buffer.from(item.key.replace('0x', ''), 'hex')).getPublicKey().toString('hex');
          expect(pubKey.eth === ethPubKey).to.eq(true);
        }

        expect(key).to.not.eq(null);
        continue;
      }

      const seed = bip39.mnemonicToSeed(item.key);
      let hdwallet = hdkey.fromMasterSeed(seed);
      const extendedPrivKey = hdwallet.privateExtendedKey();
      const privateKey = hdkey.fromExtendedKey(extendedPrivKey).getWallet().getPrivateKey();
      const account = web3.eth.accounts.privateKeyToAccount(privateKey);
      const address = account.address.toLowerCase();

      let key = _.find(keys2, {address: address});

      for (let pubKey of key.pubKeys) {
        const ethPubKey = hdwallet.derivePath(`m/44'/60'/0'/0/${pubKey.index}`).getWallet().getPublicKey().toString('hex');
        expect(pubKey.eth === ethPubKey).to.eq(true);
      }

      expect(key).to.not.eq(null);
    }


  });

  it('validate get keys route', async () => {

    const token = await tokenLib.getUserToken(ctx.client.address.toString(), [config.auth.serviceId]);

    const keys = await request({
      uri: 'http://localhost:8080/keys',
      method: 'GET',
      json: true,
      headers: {
        authorization: `Bearer ${token}`
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

    const token = await tokenLib.getUserToken(ctx.client.address.toString(), [config.auth.serviceId]);

    const reply = await request({
      uri: 'http://localhost:8080/tx/eth',
      method: 'POST',
      json: {
        signers: [address],
        payload: rawTx
      },
      headers: {
        authorization: `Bearer ${token}`
      }
    });

    expect(reply.status).to.eq(301);
  });

  it('can\'t stage non extended private key', async () => {

    const keyA = '0x7af5f0d70d97f282dfd20a9b611a2e4bd40572c038a89c0ee171a3c93bd6a17a';

    const token = await tokenLib.getUserToken(ctx.client.address.toString(), [config.auth.serviceId]);

    const keys = await request({
      uri: 'http://localhost:8080/keys',
      method: 'GET',
      json: true,
      headers: {
        authorization: `Bearer ${token}`
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
        authorization: `Bearer ${token}`
      }
    });

    expect(stageKeyResult.status).to.eq(201);

    const newKeys = await request({
      uri: 'http://localhost:8080/keys',
      method: 'GET',
      json: true,
      headers: {
        authorization: `Bearer ${token}`
      }
    });

    expect(_.isEqual(keys, newKeys)).to.eq(true);

  });

  it('can\'t delete non existent private key', async () => {

    const keyA = '0x7af5f0d70d97f282dfd20a9b611a2e4bd40572c038a89c0ee171a3c93bd6a17a';

    const token = await tokenLib.getUserToken(ctx.client.address.toString(), [config.auth.serviceId]);

    const keys = await request({
      uri: 'http://localhost:8080/keys',
      method: 'GET',
      json: true,
      headers: {
        authorization: `Bearer ${token}`
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
        authorization: `Bearer ${token}`
      }
    });

    expect(deleteKeyResult.status).to.eq(200);

    const newKeys = await request({
      uri: 'http://localhost:8080/keys',
      method: 'GET',
      json: true,
      headers: {
        authorization: `Bearer ${token}`
      }
    });

    expect(_.isEqual(keys, newKeys)).to.eq(true);

  });

  it('save the same private key for both accounts', async () => {

    const keys = [
      {key: '993130d3dd4de71254a94a47fdacb1c9f90dd33be8ad06b687bd95f073514a98'}
    ];

    ctx.keys.push(...keys);

    const token = await tokenLib.getUserToken(ctx.client.address.toString(), [config.auth.serviceId]);
    const token2 = await tokenLib.getUserToken(ctx.client2.address.toString(), [config.auth.serviceId]);


    const keys2 = await request({
      uri: 'http://localhost:8080/keys',
      method: 'POST',
      json: keys,
      headers: {
        authorization: `Bearer ${token}`
      }
    });

    const keys3 = await request({
      uri: 'http://localhost:8080/keys',
      method: 'POST',
      json: keys,
      headers: {
        authorization: `Bearer ${token2}`
      }
    });


    for (let item of keys) {

      if (item.key.length <= 66) {
        const privateKey = item.key.indexOf('0x') === 0 ? item.key : `0x${item.key}`;
        const account = web3.eth.accounts.privateKeyToAccount(privateKey);
        const address = account.address.toLowerCase();

        let key = _.find(keys2, {address: address});
        for (let pubKey of key.pubKeys) {
          const ethPubKey = Wallet.fromPrivateKey(Buffer.from(item.key.replace('0x', ''), 'hex')).getPublicKey().toString('hex');
          expect(pubKey.eth === ethPubKey).to.eq(true);
        }

        expect(key).to.not.eq(null);
        continue;
      }

      const seed = bip39.mnemonicToSeed(item.key);
      let hdwallet = hdkey.fromMasterSeed(seed);
      const extendedPrivKey = hdwallet.privateExtendedKey();
      const privateKey = hdkey.fromExtendedKey(extendedPrivKey).getWallet().getPrivateKey();
      const account = web3.eth.accounts.privateKeyToAccount(privateKey);
      const address = account.address.toLowerCase();

      let key = _.find(keys2, {address: address});

      for (let pubKey of key.pubKeys) {
        const ethPubKey = hdwallet.derivePath(`m/44'/60'/0'/0/${pubKey.index}`).getWallet().getPublicKey().toString('hex');
        expect(pubKey.eth === ethPubKey).to.eq(true);
      }

      expect(key).to.not.eq(null);
    }

    for (let item of keys) {

      if (item.key.length <= 66) {
        const privateKey = item.key.indexOf('0x') === 0 ? item.key : `0x${item.key}`;
        const account = web3.eth.accounts.privateKeyToAccount(privateKey);
        const address = account.address.toLowerCase();

        let key = _.find(keys3, {address: address});
        for (let pubKey of key.pubKeys) {
          const ethPubKey = Wallet.fromPrivateKey(Buffer.from(item.key.replace('0x', ''), 'hex')).getPublicKey().toString('hex');
          expect(pubKey.eth === ethPubKey).to.eq(true);
        }

        expect(key).to.not.eq(null);
        continue;
      }

      const seed = bip39.mnemonicToSeed(item.key);
      let hdwallet = hdkey.fromMasterSeed(seed);
      const extendedPrivKey = hdwallet.privateExtendedKey();
      const privateKey = hdkey.fromExtendedKey(extendedPrivKey).getWallet().getPrivateKey();
      const account = web3.eth.accounts.privateKeyToAccount(privateKey);
      const address = account.address.toLowerCase();

      let key = _.find(keys3, {address: address});

      for (let pubKey of key.pubKeys) {
        const ethPubKey = hdwallet.derivePath(`m/44'/60'/0'/0/${pubKey.index}`).getWallet().getPublicKey().toString('hex');
        expect(pubKey.eth === ethPubKey).to.eq(true);
      }

      expect(key).to.not.eq(null);
    }


  });

  after('kill environment', async () => {
    ctx.server.kill();
    await Promise.delay(5000);
  });

};
