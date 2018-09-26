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
  path = require('path'),
  Promise = require('bluebird'),
  config = require('../../server/config'),
  BtcPlugin = require('../../server/plugins/BtcPlugin'),
  spawn = require('child_process').spawn;

module.exports = (ctx) => {

  before(async () => {
    const bcoinPath = path.join(__dirname, '../../tests/utils/bcoin/node.js');
    ctx.nodePid = spawn('node', [bcoinPath], {env: process.env, stdio: 'ignore'});
    this.derivePurpose = new BtcPlugin(config.network).derivePurpose;
    await Promise.delay(5000);
  });

  it('generate some coins for accountB', async () => {
    const seed = bip39.mnemonicToSeed(ctx.keys[1].key);
    const key = bitcoin.HDNode.fromSeedBuffer(seed).derivePath(`m/44'/${ctx.derivePurpose.btc}'/0'`).derivePath('0/0').keyPair;
    const address = new keyring(key.d.toBuffer(32)).getAddress('base58', Network.get('regtest'));
    return await client.execute('generatetoaddress', [300, address])
  });

  it('generate some coins for accountA', async () => {

    const seed = bip39.mnemonicToSeed(ctx.keys[1].key);
    const seed2 = bip39.mnemonicToSeed(ctx.keys[0].key);
    const key = bitcoin.HDNode.fromSeedBuffer(seed).derivePath(`m/44'/${ctx.derivePurpose.btc}'/0'`).derivePath('0/0').keyPair;
    const key2 = bitcoin.HDNode.fromSeedBuffer(seed2).derivePath(`m/44'/${ctx.derivePurpose.btc}'/0'`).derivePath('0/0').keyPair;
    const addressRegtest = new keyring(key.d.toBuffer(32)).getAddress('base58', Network.get('regtest'));
    const addressRegtest2 = new keyring(key2.d.toBuffer(32)).getAddress('base58', Network.get('regtest'));

    let coins = await client.execute('getcoinsbyaddress', [addressRegtest]);
    coins = _.chain(coins).sortBy('height').take(20).value();

    const mtx = new bcoin.primitives.MTX();

    for (let index = 0; index < coins.length; index++) {
      const coin = bcoin.primitives.Coin.fromJSON(coins[index]);
      mtx.addCoin(coin);
    }

    const value = _.chain(coins).map(coin => coin.value).sort('height').take(20).sum().value() - 5000;

    mtx.addOutput({
      address: addressRegtest2,
      value: value
    });

    mtx.sign(new keyring(key.d.toBuffer(32)));

    const tx = mtx.toTX();
    const txHash = tx.txid();
    const rawTx = tx.toRaw().toString('hex');
    const sendTxResult = await client.execute('sendrawtransaction', [rawTx]);
    expect(txHash).to.eq(sendTxResult);

    await client.execute('generatetoaddress', [10, addressRegtest]);
  });

  it('create transaction for btc', async () => {

    const seed = bip39.mnemonicToSeed(ctx.keys[0].key);
    const seed2 = bip39.mnemonicToSeed(ctx.keys[1].key);
    const key = bitcoin.HDNode.fromSeedBuffer(seed).derivePath(`m/44'/${ctx.derivePurpose.btc}'/0'`).derivePath('0/0').keyPair;
    const key2 = bitcoin.HDNode.fromSeedBuffer(seed2).derivePath(`m/44'/${ctx.derivePurpose.btc}'/0'`).derivePath('0/0').keyPair;
    const addressRegtest = new keyring(key.d.toBuffer(32)).getAddress('base58', Network.get('regtest'));
    const addressRegtest2 = new keyring(key2.d.toBuffer(32)).getAddress('base58', Network.get('regtest'));
    const addressTestnet = new keyring(key.d.toBuffer(32)).getAddress('base58', Network.get('testnet'));

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

    const signerAddress = _.chain(keys)
      .find(signerKey => _.find(signerKey.pubKeys, {btc: key.getPublicKeyBuffer().toString('hex')}))
      .get('address')
      .value();

    const txb = new bitcoin.TransactionBuilder(bitcoin.networks.testnet);

    txb.addInput(coins[0].hash, coins[0].index);
    txb.addOutput(addressTestnet, coins[0].value - 5000);
    const incompleteTx = txb.buildIncomplete().toHex();

    key.network = bitcoin.networks.testnet;
    txb.sign(0, key);

    const reply = await request({
      uri: 'http://localhost:8080/tx/btc',
      method: 'POST',
      json: {
        signers: [signerAddress],
        payload: {
          incompleteTx: incompleteTx
        }
      },
      headers: {
        client_id: ctx.client.clientId
      }
    });


    expect(txb.build().toHex()).to.eq(reply.rawTx);

    const sendTxResult = await client.execute('sendrawtransaction', [reply.rawTx]);
    await client.execute('generatetoaddress', [1, addressRegtest2]);
    const pushedTx = await client.execute('getrawtransaction', [sendTxResult, false]);
    expect(pushedTx).to.not.eq(null);
  });

  it('generate some coins for multisig (one client, 2 keys)', async () => {

    const seed = bip39.mnemonicToSeed(ctx.keys[1].key);
    const key = bitcoin.HDNode.fromSeedBuffer(seed).derivePath(`m/44'/${ctx.derivePurpose.btc}'/0'`).derivePath('0/0').keyPair;

    const keys = await request({
      uri: 'http://localhost:8080/keys',
      method: 'GET',
      json: true,
      headers: {
        client_id: ctx.client.clientId
      }
    });


    const pubKeys = _.chain([keys[0].pubKeys[0].btc, keys[0].pubKeys[1].btc, keys[1].pubKeys[0].btc]).map(pubKey => Buffer.from(pubKey, 'hex')).value();

    const redeemScript = bitcoin.script.multisig.output.encode(2, pubKeys); // 2 of 3
    const scriptPubKey = bitcoin.script.scriptHash.output.encode(bitcoin.crypto.hash160(redeemScript));
    const multisigAddress = bitcoin.address.fromOutputScript(scriptPubKey, bitcoin.networks.testnet);
    const regtestMultiSig = bcoin.primitives.Address.fromOptions(multisigAddress, Network.get('testnet')).toBase58(Network.get('regtest'));

    const addressRegtest = new keyring(key.d.toBuffer(32)).getAddress('base58', Network.get('regtest'));

    let coins = await client.execute('getcoinsbyaddress', [addressRegtest]);
    coins = _.chain(coins).sortBy('height').take(20).value();

    const mtx = new bcoin.primitives.MTX();

    for (let index = 0; index < coins.length; index++) {
      const coin = bcoin.primitives.Coin.fromJSON(coins[index]);
      mtx.addCoin(coin);
    }

    const value = _.chain(coins).map(coin => coin.value).sort('height').take(20).sum().value() - 5000;

    mtx.addOutput({
      address: regtestMultiSig,
      value: value
    });

    mtx.sign(new keyring(key.d.toBuffer(32)));

    const tx = mtx.toTX();
    const txHash = tx.txid();
    const rawTx = tx.toRaw().toString('hex');
    const sendTxResult = await client.execute('sendrawtransaction', [rawTx]);
    expect(txHash).to.eq(sendTxResult);

    await client.execute('generatetoaddress', [10, addressRegtest]);
  });

  it('create multisig transaction for btc (one client, 2 keys)', async () => {

    const masterKeys = ctx.keys.map(key => {
      const seed = bip39.mnemonicToSeed(key.key);
      const masterKey = bitcoin.HDNode.fromSeedBuffer(seed).derivePath(`m/44'/${ctx.derivePurpose.btc}'/0'`);

      let hdwallet = hdkey.fromMasterSeed(seed);
      const extendedPrivKey = hdwallet.privateExtendedKey();
      const privateKey = hdkey.fromExtendedKey(extendedPrivKey).getWallet().getPrivateKey();
      const account = web3.eth.accounts.privateKeyToAccount(privateKey);
      const address = account.address.toLowerCase();

      return {
        key: masterKey,
        address: address
      }
    });

    const seed = bip39.mnemonicToSeed(ctx.keys[0]);

    const key = bitcoin.HDNode.fromSeedBuffer(seed).derivePath(`m/44'/${ctx.derivePurpose.btc}'/0'`).derivePath('0/0').keyPair;
    const addressRegtest = new keyring(key.d.toBuffer(32)).getAddress('base58', Network.get('regtest'));
    const addressTestnet = new keyring(key.d.toBuffer(32)).getAddress('base58', Network.get('testnet'));

    const keys = await request({
      uri: 'http://localhost:8080/keys',
      method: 'GET',
      json: true,
      headers: {
        client_id: ctx.client.clientId
      }
    });


    const pubKeys = _.chain([keys[0].pubKeys[0].btc, keys[0].pubKeys[1].btc, keys[1].pubKeys[0].btc]).map(pubKey => Buffer.from(pubKey, 'hex')).value();

    const keyPairs = _.chain([
      {address: keys[0].address, derive: [0, 1]},
      {address: keys[1].address, derive: [0]}
    ]).map(key => {
      let masterKey = _.find(masterKeys, {address: key.address}).key;
      return key.derive.map(index => {
        let keyPair = masterKey.derivePath(`0/${index}`).keyPair;
        keyPair.network = bitcoin.networks.testnet;
        return keyPair;
      })
    }).flattenDeep().value();


    const pubKeys2 = keyPairs.map(pair => pair.getPublicKeyBuffer().toString('hex'));

    expect(_.isEqual([keys[0].pubKeys[0].btc, keys[0].pubKeys[1].btc, keys[1].pubKeys[0].btc], pubKeys2)).to.eq(true);


    const redeemScript = bitcoin.script.multisig.output.encode(2, pubKeys); // 2 of 3
    const scriptPubKey = bitcoin.script.scriptHash.output.encode(bitcoin.crypto.hash160(redeemScript));
    const multisigAddress = bitcoin.address.fromOutputScript(scriptPubKey, bitcoin.networks.testnet);
    const regtestMultiSig = bcoin.primitives.Address.fromOptions(multisigAddress, Network.get('testnet')).toBase58(Network.get('regtest'));


    let coins = await client.execute('getcoinsbyaddress', [regtestMultiSig]);
    coins = _.sortBy(coins, 'height');

    const txb = new bitcoin.TransactionBuilder(bitcoin.networks.testnet);

    txb.addInput(coins[0].hash, coins[0].index);
    txb.addOutput(addressTestnet, coins[0].value - 5000);
    const incompleteTx = txb.buildIncomplete().toHex();

    const reply = await request({
      uri: 'http://localhost:8080/tx/btc',
      method: 'POST',
      json: {
        signers: [keys[0].address, keys[1].address],
        payload: {
          incompleteTx: incompleteTx,
          redeemScript: redeemScript
        },
        options: {
          sigRequired: 2,
          useKeys: {
            [keys[0].address]: [0, 1],
            [keys[1].address]: [0]
          }
        }
      },
      headers: {
        client_id: ctx.client.clientId
      }
    });

    for (let i = 0; i < txb.tx.ins.length; i++)
      for (let keyPair of _.take(keyPairs, 2))
        txb.sign(i, keyPair, redeemScript);


    expect(txb.build().toHex()).to.eq(reply.rawTx);


    const sendTxResult = await client.execute('sendrawtransaction', [reply.rawTx]);
    await client.execute('generatetoaddress', [1, addressRegtest]);
    const pushedTx = await client.execute('getrawtransaction', [sendTxResult, false]);
    expect(pushedTx).to.not.eq(null);
  });

  it('generate some coins for multisig (two clients, 3 keys)', async () => {

    const seed = bip39.mnemonicToSeed(ctx.keys[1].key);
    const key = bitcoin.HDNode.fromSeedBuffer(seed).derivePath(`m/44'/${ctx.derivePurpose.btc}'/0'`).derivePath('0/0').keyPair;

    const keys = await request({
      uri: 'http://localhost:8080/keys',
      method: 'GET',
      json: true,
      headers: {
        client_id: ctx.client2.clientId
      }
    });

    ctx.sharedKey = _.find(keys, key => key.pubKeys.length > 2);


    const shareKeyResult = await request({
      uri: 'http://localhost:8080/keys',
      method: 'PUT',
      json: {
        address: ctx.sharedKey.address,
        share: 1,
        children: [0, 1],
        clientId: ctx.client.clientId
      },
      headers: {
        client_id: ctx.client2.clientId
      }
    });


    const keys2 = await request({
      uri: 'http://localhost:8080/keys',
      method: 'GET',
      json: true,
      headers: {
        client_id: ctx.client.clientId
      }
    });

    const pubKeys = _.chain([keys2[0].pubKeys[0].btc, keys2[0].pubKeys[1].btc, ctx.sharedKey.pubKeys[0].btc]).map(pubKey => Buffer.from(pubKey, 'hex')).value();

    const redeemScript = bitcoin.script.multisig.output.encode(2, pubKeys); // 2 of 3
    const scriptPubKey = bitcoin.script.scriptHash.output.encode(bitcoin.crypto.hash160(redeemScript));
    const multisigAddress = bitcoin.address.fromOutputScript(scriptPubKey, bitcoin.networks.testnet);
    const regtestMultiSig = bcoin.primitives.Address.fromOptions(multisigAddress, Network.get('testnet')).toBase58(Network.get('regtest'));

    const addressRegtest = new keyring(key.d.toBuffer(32)).getAddress('base58', Network.get('regtest'));

    let coins = await client.execute('getcoinsbyaddress', [addressRegtest]);
    coins = _.chain(coins).sortBy('height').take(20).value();

    const mtx = new bcoin.primitives.MTX();

    for (let index = 0; index < coins.length; index++) {
      const coin = bcoin.primitives.Coin.fromJSON(coins[index]);
      mtx.addCoin(coin);
    }

    const value = _.chain(coins).map(coin => coin.value).sort('height').take(20).sum().value() - 5000;

    mtx.addOutput({
      address: regtestMultiSig,
      value: value
    });

    mtx.sign(new keyring(key.d.toBuffer(32)));

    const tx = mtx.toTX();
    const txHash = tx.txid();
    const rawTx = tx.toRaw().toString('hex');
    const sendTxResult = await client.execute('sendrawtransaction', [rawTx]);
    expect(txHash).to.eq(sendTxResult);

    await client.execute('generatetoaddress', [10, addressRegtest]);
  });

  it('create multisig transaction for btc (two clients, 3 keys)', async () => {

    const masterKeys = _.union(ctx.keys, ctx.keys2).map(key => {
      const seed = bip39.mnemonicToSeed(key.key);
      const masterKey = bitcoin.HDNode.fromSeedBuffer(seed).derivePath(`m/44'/${ctx.derivePurpose.btc}'/0'`);

      let hdwallet = hdkey.fromMasterSeed(seed);
      const extendedPrivKey = hdwallet.privateExtendedKey();
      const privateKey = hdkey.fromExtendedKey(extendedPrivKey).getWallet().getPrivateKey();
      const account = web3.eth.accounts.privateKeyToAccount(privateKey);
      const address = account.address.toLowerCase();

      return {
        key: masterKey,
        address: address
      }
    });

    const seed = bip39.mnemonicToSeed(ctx.keys[0]);

    const key = bitcoin.HDNode.fromSeedBuffer(seed).derivePath(`m/44'/${ctx.derivePurpose.btc}'/0'`).derivePath('0/0').keyPair;
    const addressRegtest = new keyring(key.d.toBuffer(32)).getAddress('base58', Network.get('regtest'));
    const addressTestnet = new keyring(key.d.toBuffer(32)).getAddress('base58', Network.get('testnet'));

    const keys = await request({
      uri: 'http://localhost:8080/keys',
      method: 'GET',
      json: true,
      headers: {
        client_id: ctx.client.clientId
      }
    });


    const pubKeys = _.chain([keys[0].pubKeys[0].btc, keys[0].pubKeys[1].btc, ctx.sharedKey.pubKeys[0].btc]).map(pubKey => Buffer.from(pubKey, 'hex')).value();

    const keyPairs = _.chain([
      {address: keys[0].address, derive: [0, 1]},
      {address: ctx.sharedKey.address, derive: [ctx.sharedKey.pubKeys[0].index]}
    ]).map(key => {
      let masterKey = _.find(masterKeys, {address: key.address}).key;
      return key.derive.map(index => {
        let keyPair = masterKey.derivePath(`0/${index}`).keyPair;
        keyPair.network = bitcoin.networks.testnet;
        return keyPair;
      })
    }).flattenDeep().value();


    const pubKeys2 = keyPairs.map(pair => pair.getPublicKeyBuffer().toString('hex'));

    expect(_.isEqual([keys[0].pubKeys[0].btc, keys[0].pubKeys[1].btc, ctx.sharedKey.pubKeys[0].btc], pubKeys2)).to.eq(true);


    const redeemScript = bitcoin.script.multisig.output.encode(2, pubKeys); // 2 of 3
    const scriptPubKey = bitcoin.script.scriptHash.output.encode(bitcoin.crypto.hash160(redeemScript));
    const multisigAddress = bitcoin.address.fromOutputScript(scriptPubKey, bitcoin.networks.testnet);
    const regtestMultiSig = bcoin.primitives.Address.fromOptions(multisigAddress, Network.get('testnet')).toBase58(Network.get('regtest'));


    let coins = await client.execute('getcoinsbyaddress', [regtestMultiSig]);
    coins = _.sortBy(coins, 'height');

    const txb = new bitcoin.TransactionBuilder(bitcoin.networks.testnet);

    txb.addInput(coins[0].hash, coins[0].index);
    txb.addOutput(addressTestnet, coins[0].value - 5000);
    const incompleteTx = txb.buildIncomplete().toHex();

    const reply = await request({
      uri: 'http://localhost:8080/tx/btc',
      method: 'POST',
      json: {
        signers: [keys[0].address, ctx.sharedKey.address],
        payload: {
          incompleteTx: incompleteTx,
          redeemScript: redeemScript
        },
        options: {
          sigRequired: 2,
          useKeys: {
            [keys[0].address]: [0, 1],
            [ctx.sharedKey.address]: [ctx.sharedKey.pubKeys[0].index]
          }
        }
      },
      headers: {
        client_id: ctx.client.clientId
      }
    });

    for (let i = 0; i < txb.tx.ins.length; i++)
      for (let keyPair of _.take(keyPairs, 2))
        txb.sign(i, keyPair, redeemScript);


    expect(txb.build().toHex()).to.eq(reply.rawTx);


    const sendTxResult = await client.execute('sendrawtransaction', [reply.rawTx]);
    await client.execute('generatetoaddress', [1, addressRegtest]);
    const pushedTx = await client.execute('getrawtransaction', [sendTxResult, false]);
    expect(pushedTx).to.not.eq(null);
  });

  it('generate some coins for multisig again (two clients, 3 keys)', async () => {

    const seed = bip39.mnemonicToSeed(ctx.keys[1].key);
    const key = bitcoin.HDNode.fromSeedBuffer(seed).derivePath(`m/44'/${ctx.derivePurpose.btc}'/0'`).derivePath('0/0').keyPair;

    const keys = await request({
      uri: 'http://localhost:8080/keys',
      method: 'GET',
      json: true,
      headers: {
        client_id: ctx.client.clientId
      }
    });

    const pubKeys = _.chain([keys[0].pubKeys[0].btc, keys[0].pubKeys[1].btc, ctx.sharedKey.pubKeys[0].btc]).map(pubKey => Buffer.from(pubKey, 'hex')).value();

    const redeemScript = bitcoin.script.multisig.output.encode(2, pubKeys); // 2 of 3
    const scriptPubKey = bitcoin.script.scriptHash.output.encode(bitcoin.crypto.hash160(redeemScript));
    const multisigAddress = bitcoin.address.fromOutputScript(scriptPubKey, bitcoin.networks.testnet);
    const regtestMultiSig = bcoin.primitives.Address.fromOptions(multisigAddress, Network.get('testnet')).toBase58(Network.get('regtest'));

    const addressRegtest = new keyring(key.d.toBuffer(32)).getAddress('base58', Network.get('regtest'));

    let coins = await client.execute('getcoinsbyaddress', [addressRegtest]);
    coins = _.chain(coins).sortBy('height').take(20).value();

    const mtx = new bcoin.primitives.MTX();

    for (let index = 0; index < coins.length; index++) {
      const coin = bcoin.primitives.Coin.fromJSON(coins[index]);
      mtx.addCoin(coin);
    }

    const value = _.chain(coins).map(coin => coin.value).sort('height').take(20).sum().value() - 5000;

    mtx.addOutput({
      address: regtestMultiSig,
      value: value
    });

    mtx.sign(new keyring(key.d.toBuffer(32)));

    const tx = mtx.toTX();
    const txHash = tx.txid();
    const rawTx = tx.toRaw().toString('hex');
    const sendTxResult = await client.execute('sendrawtransaction', [rawTx]);
    expect(txHash).to.eq(sendTxResult);

    await client.execute('generatetoaddress', [10, addressRegtest]);
  });

  it('create multisig transaction for btc in two steps (two clients, 3 keys)', async () => {

    const masterKeys = _.union(ctx.keys, ctx.keys2).map(key => {
      const seed = bip39.mnemonicToSeed(key.key);
      const masterKey = bitcoin.HDNode.fromSeedBuffer(seed).derivePath(`m/44'/${ctx.derivePurpose.btc}'/0'`);

      let hdwallet = hdkey.fromMasterSeed(seed);
      const extendedPrivKey = hdwallet.privateExtendedKey();
      const privateKey = hdkey.fromExtendedKey(extendedPrivKey).getWallet().getPrivateKey();
      const account = web3.eth.accounts.privateKeyToAccount(privateKey);
      const address = account.address.toLowerCase();

      return {
        key: masterKey,
        address: address
      }
    });

    const seed = bip39.mnemonicToSeed(ctx.keys[0]);

    const key = bitcoin.HDNode.fromSeedBuffer(seed).derivePath(`m/44'/${ctx.derivePurpose.btc}'/0'`).derivePath('0/0').keyPair;
    const addressRegtest = new keyring(key.d.toBuffer(32)).getAddress('base58', Network.get('regtest'));
    const addressTestnet = new keyring(key.d.toBuffer(32)).getAddress('base58', Network.get('testnet'));

    const keys = await request({
      uri: 'http://localhost:8080/keys',
      method: 'GET',
      json: true,
      headers: {
        client_id: ctx.client.clientId
      }
    });


    const pubKeys = _.chain([keys[0].pubKeys[0].btc, keys[0].pubKeys[1].btc, ctx.sharedKey.pubKeys[0].btc]).map(pubKey => Buffer.from(pubKey, 'hex')).value();

    const keyPairs = _.chain([
      {address: keys[0].address, derive: [0, 1]},
      {address: ctx.sharedKey.address, derive: [ctx.sharedKey.pubKeys[0].index]}
    ]).map(key => {
      let masterKey = _.find(masterKeys, {address: key.address}).key;
      return key.derive.map(index => {
        let keyPair = masterKey.derivePath(`0/${index}`).keyPair;
        keyPair.network = bitcoin.networks.testnet;
        return keyPair;
      })
    }).flattenDeep().value();


    const pubKeys2 = keyPairs.map(pair => pair.getPublicKeyBuffer().toString('hex'));

    expect(_.isEqual([keys[0].pubKeys[0].btc, keys[0].pubKeys[1].btc, ctx.sharedKey.pubKeys[0].btc], pubKeys2)).to.eq(true);


    const redeemScript = bitcoin.script.multisig.output.encode(2, pubKeys); // 2 of 3
    const scriptPubKey = bitcoin.script.scriptHash.output.encode(bitcoin.crypto.hash160(redeemScript));
    const multisigAddress = bitcoin.address.fromOutputScript(scriptPubKey, bitcoin.networks.testnet);
    const regtestMultiSig = bcoin.primitives.Address.fromOptions(multisigAddress, Network.get('testnet')).toBase58(Network.get('regtest'));


    let coins = await client.execute('getcoinsbyaddress', [regtestMultiSig]);
    coins = _.sortBy(coins, 'height');

    const txb = new bitcoin.TransactionBuilder(bitcoin.networks.testnet);

    txb.addInput(coins[0].hash, coins[0].index);
    txb.addOutput(addressTestnet, coins[0].value - 5000);
    const incompleteTx = txb.buildIncomplete().toHex();

    const reply = await request({
      uri: 'http://localhost:8080/tx/btc',
      method: 'POST',
      json: {
        signers: [keys[0].address],
        payload: {
          incompleteTx: incompleteTx,
          redeemScript: redeemScript
        },
        options: {
          sigRequired: 2,
          useKeys: {
            [keys[0].address]: [0]
          }
        }
      },
      headers: {
        client_id: ctx.client.clientId
      }
    });


    const reply2 = await request({
      uri: 'http://localhost:8080/tx/btc',
      method: 'POST',
      json: {
        signers: [ctx.sharedKey.address],
        payload: {
          incompleteTx: reply.rawTx,
          redeemScript: redeemScript
        },
        options: {
          sigRequired: 2,
          useKeys: {
            [ctx.sharedKey.address]: [ctx.sharedKey.pubKeys[0].index]
          }
        }
      },
      headers: {
        client_id: ctx.client2.clientId
      }
    });

    for (let i = 0; i < txb.tx.ins.length; i++)
      for (let keyPair of [keyPairs[0], keyPairs[2]])
        txb.sign(i, keyPair, redeemScript);


    expect(txb.build().toHex()).to.eq(reply2.rawTx);


    const sendTxResult = await client.execute('sendrawtransaction', [reply2.rawTx]);
    await client.execute('generatetoaddress', [1, addressRegtest]);
    const pushedTx = await client.execute('getrawtransaction', [sendTxResult, false]);
    expect(pushedTx).to.not.eq(null);
  });


  it('check keys staging', async () => {

    const keys = await request({
      uri: 'http://localhost:8080/keys',
      method: 'GET',
      json: true,
      headers: {
        client_id: ctx.client.clientId
      }
    });

    expect(_.filter(keys, {shared: false}).length).to.eq(ctx.keys.length);

    let stageKey = _.find(keys, key => key.pubKeys.length > 1);


    const stageKeyResult = await request({
      uri: 'http://localhost:8080/keys',
      method: 'PUT',
      json: {
        address: stageKey.address,
        stageChild: 1
      },
      headers: {
        client_id: ctx.client.clientId
      }
    });

    expect(stageKeyResult.status).to.eq(1);


    const newKeys = await request({
      uri: 'http://localhost:8080/keys',
      method: 'GET',
      json: true,
      headers: {
        client_id: ctx.client.clientId
      }
    });

    let newStageKey = _.find(newKeys, {address: stageKey.address});
    let stageKeyIndex = _.chain(stageKey.pubKeys).sortBy('index').last().get('index').value();

    expect(newStageKey).to.not.eq(null);
    expect(newStageKey.pubKeys.length).to.eq(1);
    expect(newStageKey.pubKeys[0].index).to.eq(stageKeyIndex);


    let derivedPubKeyValid = _.chain(ctx.keys).find(item => {
      const seed = bip39.mnemonicToSeed(item.key);
      let hdwallet = hdkey.fromMasterSeed(seed);
      const extendedPrivKey = hdwallet.privateExtendedKey();
      const privateKey = hdkey.fromExtendedKey(extendedPrivKey).getWallet().getPrivateKey();
      const account = web3.eth.accounts.privateKeyToAccount(privateKey);
      const address = account.address.toLowerCase();

      return address === stageKey.address;
    }).thru(item => {
      const seed = bip39.mnemonicToSeed(item.key);
      const btcPuBkey = bitcoin.HDNode.fromSeedBuffer(seed).derivePath(`m/44'/${ctx.derivePurpose.btc}'/0'`).derivePath(`0/${stageKeyIndex}`).keyPair.getPublicKeyBuffer().toString('hex');
      return btcPuBkey === newStageKey.pubKeys[0].btc;
    }).value();

    expect(derivedPubKeyValid).to.eq(true);
  });

  it('increment staged key', async () => {

    const keys = await request({
      uri: 'http://localhost:8080/keys',
      method: 'GET',
      json: true,
      headers: {
        client_id: ctx.client.clientId
      }
    });

    expect(_.filter(keys, {shared: false}).length).to.eq(ctx.keys.length);

    let stageKey = _.find(keys, key => key.pubKeys.length === 1);


    const stageKeyResult = await request({
      uri: 'http://localhost:8080/keys',
      method: 'PUT',
      json: {
        address: stageKey.address,
        incrementChild: 1
      },
      headers: {
        client_id: ctx.client.clientId
      }
    });

    expect(stageKeyResult.status).to.eq(1);


    const newKeys = await request({
      uri: 'http://localhost:8080/keys',
      method: 'GET',
      json: true,
      headers: {
        client_id: ctx.client.clientId
      }
    });

    let newStageKey = _.find(newKeys, {address: stageKey.address});
    let stageKeyIndex = _.chain(stageKey.pubKeys).sortBy('index').last().get('index').value();

    expect(newStageKey).to.not.eq(null);
    expect(newStageKey.pubKeys.length).to.eq(1);
    expect(newStageKey.pubKeys[0].index).to.eq(stageKeyIndex + 1);


    let derivedPubKeyValid = _.chain(ctx.keys).find(item => {
      const seed = bip39.mnemonicToSeed(item.key);
      let hdwallet = hdkey.fromMasterSeed(seed);
      const extendedPrivKey = hdwallet.privateExtendedKey();
      const privateKey = hdkey.fromExtendedKey(extendedPrivKey).getWallet().getPrivateKey();
      const account = web3.eth.accounts.privateKeyToAccount(privateKey);
      const address = account.address.toLowerCase();

      return address === stageKey.address;
    }).thru(item => {
      const seed = bip39.mnemonicToSeed(item.key);
      const btcPuBkey = bitcoin.HDNode.fromSeedBuffer(seed).derivePath(`m/44'/${ctx.derivePurpose.btc}'/0'`).derivePath(`0/${stageKeyIndex + 1}`).keyPair.getPublicKeyBuffer().toString('hex');
      return btcPuBkey === newStageKey.pubKeys[0].btc;
    }).value();

    expect(derivedPubKeyValid).to.eq(true);
  });

  it('generate some coins for accountB', async () => {

    const keys = await request({
      uri: 'http://localhost:8080/keys',
      method: 'GET',
      json: true,
      headers: {
        client_id: ctx.client.clientId
      }
    });

    let key = _.chain(ctx.keys).find(item => {
      const seed = bip39.mnemonicToSeed(item.key);
      let hdwallet = hdkey.fromMasterSeed(seed);
      const extendedPrivKey = hdwallet.privateExtendedKey();
      const privateKey = hdkey.fromExtendedKey(extendedPrivKey).getWallet().getPrivateKey();
      const account = web3.eth.accounts.privateKeyToAccount(privateKey);
      const address = account.address.toLowerCase();

      const foundKey = _.find(keys, {address: address});
      return foundKey.pubKeys.length !== 1;
    }).thru(item => {
      const seed = bip39.mnemonicToSeed(item.key);
      return bitcoin.HDNode.fromSeedBuffer(seed).derivePath(`m/44'/${ctx.derivePurpose.btc}'/0'`).derivePath('0/0').keyPair;
    }).value();

    const address = new keyring(key.d.toBuffer(32)).getAddress('base58', Network.get('regtest'));
    return await client.execute('generatetoaddress', [300, address])
  });

  it('generate some coins for accountA', async () => {


    const keys = await request({
      uri: 'http://localhost:8080/keys',
      method: 'GET',
      json: true,
      headers: {
        client_id: ctx.client.clientId
      }
    });

    const keyA = _.chain(ctx.keys).find(item => {
      const seed = bip39.mnemonicToSeed(item.key);
      let hdwallet = hdkey.fromMasterSeed(seed);
      const extendedPrivKey = hdwallet.privateExtendedKey();
      const privateKey = hdkey.fromExtendedKey(extendedPrivKey).getWallet().getPrivateKey();
      const account = web3.eth.accounts.privateKeyToAccount(privateKey);
      const address = account.address.toLowerCase();

      const foundKey = _.find(keys, {address: address});
      return foundKey.pubKeys.length !== 1;
    }).thru(item => {
      const seed = bip39.mnemonicToSeed(item.key);
      return bitcoin.HDNode.fromSeedBuffer(seed).derivePath(`m/44'/${ctx.derivePurpose.btc}'/0'`).derivePath('0/0').keyPair;
    }).value();


    const keyB = _.chain(ctx.keys).find(item => {
      const seed = bip39.mnemonicToSeed(item.key);
      let hdwallet = hdkey.fromMasterSeed(seed);
      const extendedPrivKey = hdwallet.privateExtendedKey();
      const privateKey = hdkey.fromExtendedKey(extendedPrivKey).getWallet().getPrivateKey();
      const account = web3.eth.accounts.privateKeyToAccount(privateKey);
      const address = account.address.toLowerCase();

      const foundKey = _.find(keys, {address: address});
      return foundKey.pubKeys.length === 1;
    }).thru(item => {
      const seed = bip39.mnemonicToSeed(item.key);
      return bitcoin.HDNode.fromSeedBuffer(seed).derivePath(`m/44'/${ctx.derivePurpose.btc}'/0'`).derivePath('0/0').keyPair;
    }).value();


    const addressRegtestA = new keyring(keyA.d.toBuffer(32)).getAddress('base58', Network.get('regtest'));
    const addressRegtestB = new keyring(keyB.d.toBuffer(32)).getAddress('base58', Network.get('regtest'));

    let coins = await client.execute('getcoinsbyaddress', [addressRegtestA]);
    coins = _.chain(coins).sortBy('height').take(20).value();

    const mtx = new bcoin.primitives.MTX();

    for (let index = 0; index < coins.length; index++) {
      const coin = bcoin.primitives.Coin.fromJSON(coins[index]);
      mtx.addCoin(coin);
    }

    const value = _.chain(coins).map(coin => coin.value).sort('height').take(20).sum().value() - 5000;

    mtx.addOutput({
      address: addressRegtestB,
      value: value
    });

    mtx.sign(new keyring(keyA.d.toBuffer(32)));

    const tx = mtx.toTX();
    const txHash = tx.txid();
    const rawTx = tx.toRaw().toString('hex');
    const sendTxResult = await client.execute('sendrawtransaction', [rawTx]);
    expect(txHash).to.eq(sendTxResult);

    await client.execute('generatetoaddress', [10, addressRegtestA]);
  });

  it('create transaction for btc with staged key', async () => {

    const keys = await request({
      uri: 'http://localhost:8080/keys',
      method: 'GET',
      json: true,
      headers: {
        client_id: ctx.client.clientId
      }
    });

    const keyA = _.chain(ctx.keys).find(item => {
      const seed = bip39.mnemonicToSeed(item.key);
      let hdwallet = hdkey.fromMasterSeed(seed);
      const extendedPrivKey = hdwallet.privateExtendedKey();
      const privateKey = hdkey.fromExtendedKey(extendedPrivKey).getWallet().getPrivateKey();
      const account = web3.eth.accounts.privateKeyToAccount(privateKey);
      const address = account.address.toLowerCase();

      const foundKey = _.find(keys, {address: address});
      return foundKey.pubKeys.length !== 1;
    }).thru(item => {
      const seed = bip39.mnemonicToSeed(item.key);
      return bitcoin.HDNode.fromSeedBuffer(seed).derivePath(`m/44'/${ctx.derivePurpose.btc}'/0'`).derivePath('0/0').keyPair;
    }).value();


    const keyB = _.chain(ctx.keys).find(item => {
      const seed = bip39.mnemonicToSeed(item.key);
      let hdwallet = hdkey.fromMasterSeed(seed);
      const extendedPrivKey = hdwallet.privateExtendedKey();
      const privateKey = hdkey.fromExtendedKey(extendedPrivKey).getWallet().getPrivateKey();
      const account = web3.eth.accounts.privateKeyToAccount(privateKey);
      const address = account.address.toLowerCase();

      const foundKey = _.find(keys, {address: address});
      return foundKey.pubKeys.length === 1;
    }).thru(item => {
      const seed = bip39.mnemonicToSeed(item.key);
      return bitcoin.HDNode.fromSeedBuffer(seed).derivePath(`m/44'/${ctx.derivePurpose.btc}'/0'`).derivePath('0/0').keyPair;
    }).value();


    const addressRegtestA = new keyring(keyA.d.toBuffer(32)).getAddress('base58', Network.get('regtest'));
    const addressRegtestB = new keyring(keyB.d.toBuffer(32)).getAddress('base58', Network.get('regtest'));
    const addressTestnetA = new keyring(keyA.d.toBuffer(32)).getAddress('base58', Network.get('testnet'));

    let coins = await client.execute('getcoinsbyaddress', [addressRegtestB]);
    coins = _.sortBy(coins, 'height');


    const signerAddress = _.chain(keys)
      .find(signerKey => signerKey.pubKeys.length === 1)
      .get('address')
      .value();

    const txb = new bitcoin.TransactionBuilder(bitcoin.networks.testnet);

    txb.addInput(coins[0].hash, coins[0].index);
    txb.addOutput(addressTestnetA, coins[0].value - 5000);
    const incompleteTx = txb.buildIncomplete().toHex();

    keyB.network = bitcoin.networks.testnet;
    txb.sign(0, keyB);

    const reply = await request({
      uri: 'http://localhost:8080/tx/btc',
      method: 'POST',
      json: {
        signers: [signerAddress],
        payload: {
          incompleteTx: incompleteTx
        }
      },
      headers: {
        client_id: ctx.client.clientId
      }
    });


    expect(txb.build().toHex()).to.eq(reply.rawTx);

    const sendTxResult = await client.execute('sendrawtransaction', [reply.rawTx]);
    await client.execute('generatetoaddress', [1, addressRegtestA]);
    const pushedTx = await client.execute('getrawtransaction', [sendTxResult, false]);
    expect(pushedTx).to.not.eq(null);
  });


  after('kill environment', async () => {
    ctx.nodePid.kill();
  });


};
