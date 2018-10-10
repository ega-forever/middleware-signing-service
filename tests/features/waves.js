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
  WavesAPI = require('@waves/waves-api');

module.exports = (ctx) => {

  before(async () => {
  });


  it('save 2 private keys', async () => {

    const keys = [];

    for(let index = 0;index < 2;index++){
      const seed = bip39.generateMnemonic();
      let hdwallet = hdkey.fromMasterSeed(seed);
      const extendedPrivKey = hdwallet.privateExtendedKey();
      const privateKey = hdkey.fromExtendedKey(extendedPrivKey).getWallet().getPrivateKey().toString('hex');
      keys.push({key: privateKey})
    }

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

        const Waves = WavesAPI.create(WavesAPI.TESTNET_CONFIG);
        const keyPair = Waves.Seed.fromExistingPhrase(privateKey).keyPair;


        let key = _.find(keys, {address: address});
        expect(key.pubKeys[0].waves === keyPair.publicKey.toString()).to.eq(true);
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

        let privateKey = hdwallet.derivePath(`m/44'/${ctx.derivePurpose.waves}'/0'/0/${pubKey.index}`).getWallet().getPrivateKey().toString('hex');
        const Waves = WavesAPI.create(WavesAPI.TESTNET_CONFIG);
        const keyPair = Waves.Seed.fromExistingPhrase(privateKey).keyPair;
        expect(pubKey.waves === keyPair.publicKey.toString()).to.eq(true);
      }

      expect(key).to.not.eq(null);
    }
  });


  it('create transaction for waves', async () => {

    let privateKey = _.chain(ctx.keys).find(item => item.key.length <= 66).thru(item => {
      return item.key.replace('0x', '');
    }).value();

    const Waves = WavesAPI.create(WavesAPI.TESTNET_CONFIG);
    const keyPair = Waves.Seed.fromExistingPhrase(privateKey).keyPair;

    const txParams = {
      type: 4,
      senderPublicKey: keyPair.publicKey,
      recipient: Waves.tools.getAddressFromPublicKey(keyPair.publicKey),
      assetId: 'WAVES',
      amount: 10000000,
      feeAssetId: 'WAVES',
      fee: 100000,
      attachment: '',
      timestamp: Date.now()
    };

    let name = _.chain(Waves.constants).toPairs()
      .find(pair=>pair[0].includes('_TX') && pair[1] === txParams.type)
      .get(0)
      .thru(item=> Waves.constants[`${item}_NAME`])
      .value();

    const account = web3.eth.accounts.privateKeyToAccount(`0x${privateKey}`);
    const address = account.address.toLowerCase();

    let tx = await Waves.tools.createTransaction(name, txParams);
    tx.addProof(keyPair.privateKey);
    const signedTx = await tx.getJSON();

    const reply = await request({
      uri: 'http://localhost:8080/tx/waves',
      method: 'POST',
      json: {
        signers: [address],
        payload: txParams
      },
      headers: {
        client_id: ctx.client.clientId
      }
    });

    let bytes = await tx.signatureGenerator.getBytes();
    let isValid = Waves.crypto.isValidSignature(bytes, signedTx.proofs[0], keyPair.publicKey);
    let isValid2 = Waves.crypto.isValidSignature(bytes, reply.rawTx.proofs[0], keyPair.publicKey);

    expect(isValid).to.eq(true);
    expect(isValid2).to.eq(true);

    expect(reply.rawTx).to.include.all.keys(...Object.keys(signedTx));
        expect(_.isEqual(_.omit(reply.rawTx, 'proofs'), _.omit(signedTx, 'proofs'))).to.eq(true);
  });


};
