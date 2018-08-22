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
  bcoin = require('bcoin'),
  Network = require('bcoin/lib/protocol/network'),
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

  it('validate get keys route', async () => {

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

        const ethPubKey = hdwallet.derivePath(`m/44'/60'/0'/0/${pubKey.index}`).getWallet().getPublicKey().toString('hex');
        const btcPuBkey = bitcoin.HDNode.fromSeedBuffer(seed).derivePath("m/44'/0'/0'").derivePath(`0/${pubKey.index}`).keyPair.getPublicKeyBuffer().toString('hex');
        expect(pubKey.eth === ethPubKey).to.eq(true);
        expect(pubKey.btc === btcPuBkey).to.eq(true);
      }

      expect(key).to.not.eq(null);
    }
  });

  it('generate some coins for accountB', async () => {
    const seed = bip39.mnemonicToSeed(ctx.keys[1].key);
    const key = bitcoin.HDNode.fromSeedBuffer(seed).derivePath("m/44'/0'/0'").derivePath('0/0').keyPair;
    const address = new keyring(key.privateKey).getAddress('base58', ctx.network);
    return await client.execute('generatetoaddress', [100, address])
  });

  it('generate some coins for accountA (in order to unlock coins for accountB)', async () => {
    const seed = bip39.mnemonicToSeed(ctx.keys[0].key);
    const key = bitcoin.HDNode.fromSeedBuffer(seed).derivePath("m/44'/0'/0'").derivePath('0/0').keyPair;
    const address = new keyring(key.privateKey).getAddress('base58', ctx.network);
    return await client.execute('generatetoaddress', [100, address]);
  });

  it('create transaction for btc', async () => {

    const seed = bip39.mnemonicToSeed(ctx.keys[1].key);
    const seed2 = bip39.mnemonicToSeed(ctx.keys[0].key);
    const key = bitcoin.HDNode.fromSeedBuffer(seed).derivePath("m/44'/0'/0'").derivePath('0/0').keyPair;
    const key2 = bitcoin.HDNode.fromSeedBuffer(seed2).derivePath("m/44'/0'/0'").derivePath('0/0').keyPair;
    const addressRegtest = new keyring(key.privateKey).getAddress('base58', Network.get('regtest'));
    const addressRegtest2 = new keyring(key2.privateKey).getAddress('base58', Network.get('regtest'));
    const addressTestnet = new keyring(key.privateKey).getAddress('base58', Network.get('testnet'));

    let coins = await client.execute('getcoinsbyaddress', [addressRegtest]);

    coins = _.sortBy(coins, 'height');

    const keys = await request({
      uri: 'http://localhost:8080/keys',
      method: 'GET',
      json: true,
      headers: {
        client_id: ctx.client.clientId
      }
    });

    const txb = new bitcoin.TransactionBuilder(bitcoin.networks.testnet);
    txb.addInput(coins[0].hash, coins[0].index);
    txb.addOutput(addressTestnet, coins[0].value - 5000);
    const incompleteTx = txb.buildIncomplete().toHex();

    const reply = await request({
      uri: 'http://localhost:8080/tx/btc',
      method: 'POST',
      json: {
        signers: [keys[1].address],
        payload: {
          incompleteTx: incompleteTx
        }
      },
      headers: {
        client_id: ctx.client.clientId
      }
    });


    const sendTxResult = await client.execute('sendrawtransaction', [reply.rawTx]);
    await client.execute('generatetoaddress', [1, addressRegtest2]);
    const pushedTx = await client.execute('getrawtransaction', [sendTxResult, false]);
    console.log(pushedTx)
  });




/*
  it('create multisig transaction for btc', async () => {

    let key = new keyring(ctx.keyPair);


    let coins = await client.execute('getcoinsbyaddress', [multisigAddress]);

    console.log(coins);



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
    const multisigAddress = bitcoin.address.fromOutputScript(scriptPubKey, bitcoin.networks.regtest);
    console.log(multisigAddress)

    await client.execute('generatetoaddress', [10, multisigAddress]);




  });
*/


  after('kill environment', async () => {
    ctx.server.kill();
  });


};
