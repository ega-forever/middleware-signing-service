/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Egor Zuev <zyev.egor@gmail.com>
 */

require('dotenv/config');

const _ = require('lodash'),
  bip39 = require('bip39'),
  EthereumTx = require('ethereumjs-tx'),
  request = require('request-promise'),
  Wallet = require('ethereumjs-wallet'),
  expect = require('chai').expect,
  Web3 = require('web3'),
  hdkey = require('ethereumjs-wallet/hdkey'),
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

    const dbPath = path.join(__dirname, '../../utils/eth/testrpc_db');
    try {
      fs.unlinkSync(dbPath);
    } catch (e) {

    }

    const ethPath = path.join(__dirname, '../../tests/utils/eth/ipcConverter.js');
    ctx.nodePid = spawn('node', [ethPath], {env: process.env, stdio: 'ignore'});
    await Promise.delay(10000);
    ctx.web3 = new Web3('http://localhost:8545');
  });


  it('save 2 private keys', async () => {

    let keys = [];

    for (let index = 0; index < 2; index++) {
      const seed = bip39.generateMnemonic();
      let hdwallet = hdkey.fromMasterSeed(seed);
      const extendedPrivKey = hdwallet.privateExtendedKey();
      const privateKey = hdkey.fromExtendedKey(extendedPrivKey).getWallet().getPrivateKey().toString('hex');
      keys.push({key: privateKey})
    }

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
        const account = ctx.web3.eth.accounts.privateKeyToAccount(privateKey);
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
      const account = ctx.web3.eth.accounts.privateKeyToAccount(privateKey);
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

    expect(_.filter(keys, {shared: false}).length).to.eq(ctx.keys.length);

    let clientCreatedKeys = _.reject(ctx.keys, key => key.info && key.info.includes('generated'));
    for (let item of clientCreatedKeys) {

      if (item.key.length <= 66) {
        const privateKey = item.key.indexOf('0x') === 0 ? item.key : `0x${item.key}`;
        const account = ctx.web3.eth.accounts.privateKeyToAccount(privateKey);
        const address = account.address.toLowerCase();

        let key = _.find(keys, {address: address});
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
      const account = ctx.web3.eth.accounts.privateKeyToAccount(privateKey);
      const address = account.address.toLowerCase();

      let key = _.find(keys, {address: address});

      for (let pubKey of key.pubKeys) {
        const ethPubKey = hdwallet.derivePath(`m/44'/60'/0'/0/${pubKey.index}`).getWallet().getPublicKey().toString('hex');
        expect(pubKey.eth === ethPubKey).to.eq(true);
      }

      expect(key).to.not.eq(null);
    }
  });

  it('send some eth to created address', async () => {

    const keyA = _.chain(ctx.keys)
      .find(item => item.key && item.key.length <= 66).thru(item => {
        return item.key.indexOf('0x') === 0 ? item.key : `0x${item.key}`;
      }).value();

    const accounts = await ctx.web3.eth.getAccounts();
    const account = ctx.web3.eth.accounts.privateKeyToAccount(keyA);
    const address = account.address.toLowerCase();

    let tx = await ctx.web3.eth.sendTransaction({
      from: accounts[0],
      to: address,
      value: ctx.web3.utils.toHex(Math.pow(10, 17) + '')
    });
    expect(tx.blockNumber).to.be.gt(0);
  });

  it('create transaction for eth', async () => {


    const keyA = _.chain(ctx.keys)
      .find(item => item.key && item.key.length <= 66).thru(item => {
        return item.key.indexOf('0x') === 0 ? item.key : `0x${item.key}`;
      }).value();


    const accounts = await ctx.web3.eth.getAccounts();
    const account = ctx.web3.eth.accounts.privateKeyToAccount(keyA);
    const address = account.address.toLowerCase();
    let nonce = await ctx.web3.eth.getTransactionCount(address);

    const rawTx = {
      nonce: ctx.web3.utils.toHex(nonce),
      gasPrice: ctx.web3.utils.toHex(ctx.web3.utils.toWei('20', 'gwei')),
      gasLimit: ctx.web3.utils.toHex(100000),
      to: accounts[4].toLowerCase(),
      from: address,
      value: ctx.web3.utils.toHex(Math.pow(10, 16) + '')
    };

    const privateKeyBuffer = Buffer.from(keyA.replace('0x', ''), 'hex');
    const tx = new EthereumTx(rawTx);
    tx.sign(privateKeyBuffer);


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

    expect(reply.rawTx).to.include.all.keys('r', 's', 'v', 'messageHash', 'rawTransaction');
    expect(reply.rawTx.rawTransaction).to.eq(`0x${tx.serialize().toString('hex')}`);
    let txResult = await ctx.web3.eth.sendSignedTransaction(reply.rawTx.rawTransaction);
    expect(txResult.transactionHash).to.eq(reply.rawTx.messageHash);
  });

  it('sign 2fa call', async () => {

    const keyA = _.chain(ctx.keys)
      .find(item => item.key && item.key.length <= 66).thru(item => {
        return item.key.indexOf('0x') === 0 ? item.key : `0x${item.key}`;
      }).value();


    const accounts = await ctx.web3.eth.getAccounts();
    const account = ctx.web3.eth.accounts.privateKeyToAccount(keyA);
    const address = account.address.toLowerCase();

    let payload = {
      sender: accounts[_.random(1, accounts.length - 1)],
      destination: accounts[_.random(1, accounts.length - 1)],
      data: `0x${Buffer.from(Math.random().toString(36).substr(2, 20)).toString('hex')}`,
      value: _.random(Math.pow(10, 6), Math.pow(10, 8))
    };

    const token = await tokenLib.getUserToken(ctx.client.address.toString(), [config.auth.serviceId]);

    const reply = await request({
      uri: 'http://localhost:8080/tx/eth/sign2facall',
      method: 'POST',
      json: {
        signers: [address],
        payload: payload
      },
      headers: {
        authorization: `Bearer ${token}`
      }
    });


    const hash = ctx.web3.utils.soliditySha3(
      {
        type: 'bytes',
        value: reply.pass
      }, {
        type: 'address',
        value: payload.sender
      }, {
        type: 'address',
        value: payload.destination
      }, {
        type: 'bytes',
        value: payload.data
      }, {
        type: 'uint256',
        value: payload.value
      }
    );

    const signed = ctx.web3.eth.accounts.sign(hash, keyA);

    expect(reply.r).to.eq(signed.r);
    expect(reply.s).to.eq(signed.s);
    expect(reply.v).to.eq(signed.v);

  });

  after('kill environment', async () => {
    ctx.nodePid.kill();
  });


};
