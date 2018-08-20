/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Egor Zuev <zyev.egor@gmail.com>
 */

require('dotenv/config');

const keyring = require('bcoin/lib/primitives/keyring'),
  _ = require('lodash'),
  bip39 = require('bip39'),
  bitcoin = require('bitcoinjs-lib'),
  Client = require('../utils/bcoin/client'),
  request = require('request-promise'),
  client = new Client('http://localhost:18332'),
  expect = require('chai').expect,
  Web3 = require('web3'),
  hdkey = require('ethereumjs-wallet/hdkey'),
  web3 = new Web3(),
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

    ctx.payload = [];

    for (let index = 0; index < 3; index++) {
      const item = {key: bip39.generateMnemonic()};

      if (index === 0)
        item.default = true;

      item.pubKeys = _.random(1 + index, 20);
      ctx.payload.push(item);
    }


    const reply = await request({
      uri: 'http://localhost:8080/keys',
      method: 'POST',
      json: ctx.payload,
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

    expect(keys.length).to.eq(ctx.payload.length);

    for (let item of ctx.payload) {

      const seed = bip39.mnemonicToSeed(item.key);
      let hdwallet = hdkey.fromMasterSeed(seed);
      const extendedPrivKey = hdwallet.privateExtendedKey();
      const privateKey = hdkey.fromExtendedKey(extendedPrivKey).getWallet().getPrivateKey();
      const account = web3.eth.accounts.privateKeyToAccount(privateKey);
      const address = account.address.toLowerCase();

      let key = _.find(keys, {address: address});

      for (let pubKey of key.pubKeys) {

        const ethPubKey = hdwallet.derivePath(`m/44'/60'/0'/0/${pubKey.index}`).getWallet().getPublicKey().toString('hex');
        const btcPuBkey = bitcoin.HDNode.fromSeedBuffer(seed).derivePath("m/44'/0'/0'").derivePath(`0/${pubKey.index}`).keyPair.getPublicKeyBuffer().toString('hex');
        expect(pubKey.eth === ethPubKey).to.eq(true);
        expect(pubKey.btc === btcPuBkey).to.eq(true);
      }

      expect(key).to.not.eq(null);
    }
  });

  /*  it('generate some coins for accountB', async () => {
      let key = new keyring(ctx.keyPair2);
      return await client.execute('generatetoaddress', [100, key.getAddress('base58', ctx.network)])
    });

    it('generate some coins for accountA (in order to unlock coins for accountB)', async () => {
      let key = new keyring(ctx.keyPair);
      return await client.execute('generatetoaddress', [100, key.getAddress('base58', ctx.network)])
    });*/

  it('create multisig transaction for btc', async () => {

    const keys = await request({
      uri: 'http://localhost:8080/keys',
      method: 'GET',
      json: true,
      headers: {
        client_id: ctx.client.clientId
      }
    });

    const pubKeys = _.chain(keys)
      .find(key => key.pubKeys.length > 2)
      .get('pubKeys')
      .map(pubKey => Buffer.from(pubKey.btc, 'hex'))
      .value();


    const redeemScript = bitcoin.script.multisig.output.encode(2, pubKeys); // 2 of 3
    const scriptPubKey = bitcoin.script.scriptHash.output.encode(bitcoin.crypto.hash160(redeemScript));
    const multisigAddress = bitcoin.address.fromOutputScript(scriptPubKey, bitcoin.networks.testnet);
    console.log(multisigAddress)

    await client.execute('generatetoaddress', [10, multisigAddress]);



    let coins = await client.execute('getcoinsbyaddress', [multisigAddress]);

    console.log(coins);


  });


  after('kill environment', async () => {
    ctx.server.kill();
  });


};
