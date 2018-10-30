/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Egor Zuev <zyev.egor@gmail.com>
 */

require('dotenv/config');

const _ = require('lodash'),
  bip39 = require('bip39'),
  request = require('request-promise'),
  expect = require('chai').expect,
  Web3 = require('web3'),
  web3 = new Web3(),
  hdkey = require('ethereumjs-wallet/hdkey'),
  xor = require('buffer-xor'),
  config = require('../../server/config'),
  nem = require('nem-sdk').default,
  lib = require('middleware_auth_lib'),
  tokenLib = new lib.Token({
    id: config.auth.serviceId,
    provider: config.auth.provider,
    secret: '123'
  });

module.exports = (ctx) => {

  before(async () => {
  });


  it('save 2 private keys', async () => {

    const seed = bip39.generateMnemonic();
    let hdwallet = hdkey.fromMasterSeed(seed);
    const extendedPrivKey = hdwallet.privateExtendedKey();
    const privateKey = hdkey.fromExtendedKey(extendedPrivKey).getWallet().getPrivateKey().toString('hex');

    const keys = [
      {key: privateKey},
      {key: bip39.generateMnemonic()}
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
        let privateKey = item.key.indexOf('0x') === 0 ? item.key : `0x${item.key}`;
        const account = web3.eth.accounts.privateKeyToAccount(privateKey);
        const address = account.address.toLowerCase();

        privateKey = privateKey.replace('0x', '');

        const part1 = Buffer.from(privateKey.substr(0, 64), 'hex');
        const part2 = Buffer.from(privateKey.substr(64, 64), 'hex');
        const hex = xor(part1, part2).toString('hex');
        let keyPair = nem.crypto.keyPair.create(hex);

        let key = _.find(keys2, {address: address});
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

      let key = _.find(keys2, {address: address});

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

    let privateKey = _.chain(ctx.keys)
      .find(item => item.key && item.key.length <= 66).thru(item => {
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

    const token = await tokenLib.getUserToken(ctx.client.address.toString(), [config.auth.serviceId]);

    const reply = await request({
      uri: 'http://localhost:8080/tx/nem',
      method: 'POST',
      json: {
        signers: [address],
        payload: txParams
      },
      headers: {
        authorization: `Bearer ${token}`
      }
    });

    expect(reply.rawTx).to.include.all.keys(...Object.keys(signedTx));
    expect(_.isEqual(reply.rawTx, signedTx)).to.eq(true);
  });

};
