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
  web3 = new Web3(),
  hdkey = require('ethereumjs-wallet/hdkey'),
  Promise = require('bluebird'),
  path = require('path'),
  fs = require('fs'),
  xor = require('buffer-xor'),
  nem = require('nem-sdk').default,
  spawn = require('child_process').spawn;

module.exports = (ctx) => {

  before(async () => {
  });


  it('save 2 private keys', async () => {

    const keys = [
      {key: '6b9027372deb53f4ae973a5614d8a57024adf33126ece6b587d9e08ba901c0d2'},
      {key: bip39.generateMnemonic()}
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

    expect(_.filter(keys, {shared: false}).length).to.eq(ctx.keys.length);

    for (let item of ctx.keys) {

      if (item.key.length <= 66) {
        let privateKey = item.key.indexOf('0x') === 0 ? item.key : `0x${item.key}`;
        const account = web3.eth.accounts.privateKeyToAccount(privateKey);
        const address = account.address.toLowerCase();

        privateKey = privateKey.replace('0x', '');

        const part1 = Buffer.from(privateKey.substr(0, 64), 'hex');
        const part2 = Buffer.from(privateKey.substr(64, 64), 'hex');
        const hex = xor(part1, part2).toString('hex');
        let keyPair = nem.crypto.keyPair.create(hex);

        let key = _.find(keys, {address: address});
        expect(key.pubKeys[0].nem === keyPair.publicKey.toString()).to.eq(true);
        expect(key).to.not.eq(null);
        continue;
      }

      const seed = bip39.mnemonicToSeed(item.key);
      let hdwallet = hdkey.fromMasterSeed(seed);
      const extendedPrivKey = hdwallet.privateExtendedKey();
      const privateKey = hdkey.fromExtendedKey(extendedPrivKey).getWallet().getPrivateKey();
      const account = web3.eth.accounts.privateKeyToAccount(privateKey);
      const address = account.address.toLowerCase();

      let key = _.find(keys, {address: address});

      for (let pubKey of key.pubKeys) {

        let privateKey = hdwallet.derivePath(`m/44'/${ctx.derivePurpose.nem}'/0'/0/${pubKey.index}`).getWallet().getPrivateKey().toString('hex');
        const part1 = Buffer.from(privateKey.substr(0, 64), 'hex');
        const part2 = Buffer.from(privateKey.substr(64, 64), 'hex');
        const hex = xor(part1, part2).toString('hex');
        let keyPair = nem.crypto.keyPair.create(hex);
        expect(pubKey.nem === keyPair.publicKey.toString()).to.eq(true);
      }

      expect(key).to.not.eq(null);
    }
  });

  it('create transaction for nem', async () => {

    let privateKey = _.chain(ctx.keys).find(item => item.key.length <= 66).thru(item => {
      return item.key.replace('0x', '');
    }).value();

    const account = web3.eth.accounts.privateKeyToAccount(`0x${privateKey}`);
    const address = account.address.toLowerCase();

    const part1 = Buffer.from(privateKey.substr(0, 64), 'hex');
    const part2 = Buffer.from(privateKey.substr(64, 64), 'hex');
    const hex = xor(part1, part2).toString('hex');
    const keyPair = nem.crypto.keyPair.create(hex);
    const common = nem.model.objects.create('common')('', keyPair.privateKey);

    let type = 'transferTransaction';
    let transferTransaction = nem.model.objects.create(type)('TBCI2A67UQZAKCR6NS4JWAEICEIGEIM72G3MVW5S', 10, 'Hello');

    const txParams = {
      type: type,
      tx: transferTransaction
    };

    const signedTx = nem.model.transactions.prepare(txParams.type)(common, txParams.tx, nem.model.network.data.testnet.id);

    const reply = await request({
      uri: 'http://localhost:8080/tx/nem',
      method: 'POST',
      json: {
        signers: [address],
        payload: txParams
      },
      headers: {
        client_id: ctx.client.clientId
      }
    });

    expect(reply.rawTx).to.include.all.keys(...Object.keys(signedTx));
        expect(_.isEqual(reply.rawTx, signedTx)).to.eq(true);
  });

};
