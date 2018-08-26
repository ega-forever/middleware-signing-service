/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Egor Zuev <zyev.egor@gmail.com>
 */

require('dotenv/config');

const _ = require('lodash'),
  bip39 = require('bip39'),
  ethereumTx = require('ethereumjs-tx'),
  Client = require('../utils/bcoin/client'),
  request = require('request-promise'),
  client = new Client('http://localhost:18332'),
  expect = require('chai').expect,
  Web3 = require('web3'),
  hdkey = require('ethereumjs-wallet/hdkey'),
  Promise = require('bluebird'),
  path = require('path'),
  fs = require('fs'),
  spawn = require('child_process').spawn;

module.exports = (ctx) => {

  before(async () => {

    const dbPath = path.join(__dirname, '../../utils/eth/testrpc_db');
    try {
      fs.unlinkSync(dbPath);
    } catch (e) {

    }

    ctx.nodePid = spawn('node', ['tests/utils/eth/ipcConverter.js'], {env: process.env, stdio: 'inherit'});
    ctx.web3 = new Web3('http://localhost:8545');
    await Promise.delay(5000);
  });

  it('generate some coins for account', async () => {


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
      const account = ctx.web3.eth.accounts.privateKeyToAccount(privateKey);
      const address = account.address.toLowerCase();

      const foundKey = _.find(keys, {address: address});
      return foundKey.pubKeys.length !== 1;
    }).thru(item => {
      const seed = bip39.mnemonicToSeed(item.key);
      let hdwallet = hdkey.fromMasterSeed(seed);
      const extendedPrivKey = hdwallet.privateExtendedKey();
      return hdkey.fromExtendedKey(extendedPrivKey).getWallet().getPrivateKey();
    }).value();


    const account = ctx.web3.eth.accounts.privateKeyToAccount(keyA);
    const address = account.address.toLowerCase();

    console.log('1)', address);


    const accounts = await ctx.web3.eth.getAccounts();
    let result = await ctx.web3.eth.sendTransaction({from: accounts[0], to: address, value: Math.pow(10, 18)});
    expect(result.transactionHash).to.not.eq(null);
    let balance = await ctx.web3.eth.getBalance(address);
    console.log(balance);
  });


  it('create transaction for eth', async () => {

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
      const account = ctx.web3.eth.accounts.privateKeyToAccount(privateKey);
      const address = account.address.toLowerCase();

      const foundKey = _.find(keys, {address: address});
      return foundKey.pubKeys.length !== 1;
    }).thru(item => {
      const seed = bip39.mnemonicToSeed(item.key);
      let hdwallet = hdkey.fromMasterSeed(seed);
      const extendedPrivKey = hdwallet.privateExtendedKey();
      return hdkey.fromExtendedKey(extendedPrivKey).getWallet().getPrivateKey();
    }).value();


    const accounts = await ctx.web3.eth.getAccounts();
    const account = ctx.web3.eth.accounts.privateKeyToAccount(keyA);
    const address = account.address.toLowerCase();
    console.log('2)', address);
    let nonce = await ctx.web3.eth.getTransactionCount(address);

    const rawTx = {
      nonce: ctx.web3.utils.toHex(nonce),
      gasPrice: ctx.web3.utils.toHex(ctx.web3.utils.toWei('20', 'gwei')),
      gasLimit: ctx.web3.utils.toHex(100000),
      to: accounts[0].toLowerCase(),
      from: address,
      value: ctx.web3.utils.toHex(Math.pow(10, 16) + '')
    };


    console.log(rawTx)




    const reply = await request({
      uri: 'http://localhost:8080/tx/eth',
      method: 'POST',
      json: {
        signers: [address],
        payload: rawTx
      },
      headers: {
        client_id: ctx.client.clientId
      }
    });

//    console.log(reply)


    expect(reply.rawTx).to.include.all.keys('r', 's', 'v', 'messageHash', 'rawTransaction');
    let txResult = await ctx.web3.eth.sendSignedTransaction(reply.rawTx.rawTransaction);
    console.log(txResult);

/*    expect(txb.build().toHex()).to.eq(reply.rawTx);

    const sendTxResult = await client.execute('sendrawtransaction', [reply.rawTx]);
    await client.execute('generatetoaddress', [1, addressRegtest2]);
    const pushedTx = await client.execute('getrawtransaction', [sendTxResult, false]);
    expect(pushedTx).to.not.eq(null);*/
  });

  /*
    it('create multisig transaction for btc', async () => {

      const seed = bip39.mnemonicToSeed(ctx.keys[0].key);
      const key = bitcoin.HDNode.fromSeedBuffer(seed).derivePath("m/44'/0'/0'").derivePath('0/0').keyPair;
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


      const sendTxResult = await client.execute('sendrawtransaction', [reply.rawTx]);
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

      expect(keys.length).to.eq(ctx.keys.length);

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
        const btcPuBkey = bitcoin.HDNode.fromSeedBuffer(seed).derivePath("m/44'/0'/0'").derivePath(`0/${stageKeyIndex}`).keyPair.getPublicKeyBuffer().toString('hex');
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

      expect(keys.length).to.eq(ctx.keys.length);

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
        const btcPuBkey = bitcoin.HDNode.fromSeedBuffer(seed).derivePath("m/44'/0'/0'").derivePath(`0/${stageKeyIndex + 1}`).keyPair.getPublicKeyBuffer().toString('hex');
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
        return bitcoin.HDNode.fromSeedBuffer(seed).derivePath("m/44'/0'/0'").derivePath('0/0').keyPair;
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
        return bitcoin.HDNode.fromSeedBuffer(seed).derivePath("m/44'/0'/0'").derivePath('0/0').keyPair;
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
        return bitcoin.HDNode.fromSeedBuffer(seed).derivePath("m/44'/0'/0'").derivePath('0/0').keyPair;
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
        return bitcoin.HDNode.fromSeedBuffer(seed).derivePath("m/44'/0'/0'").derivePath('0/0').keyPair;
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
        return bitcoin.HDNode.fromSeedBuffer(seed).derivePath("m/44'/0'/0'").derivePath('0/0').keyPair;
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
  */


  after('kill environment', async () => {
    ctx.nodePid.kill();
  });


};
