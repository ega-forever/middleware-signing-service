/** 
* Copyright 2017–2018, LaborX PTY
* Licensed under the AGPL Version 3 license.
* @author Kirill Sergeev <cloudkserg11@gmail.com>
*/
require('dotenv/config');

const config = require('../config'),
  Promise = require('bluebird'),
  bitcore = require('bitcore-lib'),
  bcoin = require('bcoin'),
 bigi = require('bigi'),
  bitcoin = require('bitcoinjs-lib'),
  expect = require('chai').expect,
  nem = require('nem-sdk').default,
  _ = require('lodash');


const request = require('request');


describe('core/service-tx', function () { //todo add integration tests for query, push tx, history and erc20tokens

  it('create waves tx and signing', async () => {
    const transferData = {
      // An arbitrary address; mine, in this example
      recipient: '3Jk2fh8aMBmhCQCkBcUfKBSEEa3pDMkDjCr',
      // ID of a token, or WAVES
      assetId: 'WAVES',
      // The real amount is the given number divided by 10^(precision of the token)
      amount: 10000000,
      // The same rules for these two fields
      feeAssetId: 'WAVES',
      fee: 100000,
      // 140 bytes of data (it's allowed to use Uint8Array here)
      attachment: '',
      timestamp: Date.now()
    };

    await new Promise((res, rej) => {
      request({
        url: `http://localhost:${config.rest.port}/sign/waves/3JfE6tjeT7PnpuDQKxiVNLn4TJUFhuMaaT5`,
        method: 'POST',
        json: {tx: transferData}
      }, async (err, resp) => {
        if (err || resp.statusCode !== 200) 
          return rej(err || resp);
        const tx = resp.body.tx;
        expect(tx).not.to.be.not.null;
        expect(tx.signature).to.be.eq('wRx6TEshbCUdgnF8KEzcEbwH9SuFv8k5gmuypZz1X5pd3zjNF6vj4EA7bLAmJ7QM7Dou3PRQdHFdF2GQFD4uuw');
        res();
      });
    });

  });

  it('create bitcoin tx and signing', async () => {
    
    const transferData = {
      "inputs" : [
        {
          "txId": "b52623a5d1dc0ce9e33aedabecb9c32e30176405a79eaeaa433897277e3a3699", 
          "vout": 0
        }
      ], "outputs": [
        {
          "address": "1PQu7or13GWCBpajsnQG89fRwjoMkbw5eP", 
          "value": 100
        }
      ]
    };

    await new Promise((res, rej) => {
      request({
        url: `http://localhost:${config.rest.port}/sign/waves/1LgGUA9v2Jria53vAzhKQLsBXY4csAp3pf`,
        method: 'POST',
        json: {tx: transferData}
      }, async (err, resp) => {
        if (err || resp.statusCode !== 200) 
          return rej(err || resp);
        const tx = resp.body;
        expect(tx.hex).to.be.eq('010000000199363a7e27973843aaae9ea7056417302ec3b9ecabed3ae3e90cdcd1a52326b5000000006a47304402203d3fa1080d8406c98f192d281237e5a3790e88eb8b85fbd6d7220ace25d2f7dc022056f7c6ef50a9c797f79e9e9736db88bb9a2106be4be346d89ec5d5100cd2e6790121033e1b6da9f1d8588d5e320df200bff9890d56829ac3df2b06c4f0cc2c14469208ffffffff0164000000000000001976a914f5d7d6fa4ddbcfa21f85e84d68d6e97b2582937b88ac00000000');
        res();
      });
    });

  });

  it('create eth tx and signing', async () => {
    const transferData = {
      "nonce": "0x00",
      "gasPrice": "0x09184e72a000", 
      "gasLimit": "0x2710",
      "to": "0x0000000000000000000000000000000000000000", 
      "value": "0x00", 
      "data": "0x7f7465737432000000000000000000000000000000000000000000000000000000600057",
      // EIP 155 chainId - mainnet: 1, ropsten: 3
      "chainId": 3
    };


    await new Promise((res, rej) => {
      request({
        url: `http://localhost:${config.rest.port}/sign/eth/TAHZD4PLMR4OX3OLNMJCC726PNLXCJMCFWR2JI3D`,
        method: 'POST',
        json: {tx: transferData}
      }, async (err, resp) => {
        if (err || resp.statusCode !== 200) 
          return rej(err || resp);
        const tx = resp.body;
        expect(tx.signature).to.be.eq('wRx6TEshbCUdgnF8KEzcEbwH9SuFv8k5gmuypZz1X5pd3zjNF6vj4EA7bLAmJ7QM7Dou3PRQdHFdF2GQFD4uuw');
        res();
      });
    });

  });

  it('create nem tx and signing', async () => {
    const transferData = {
      "amount": 10000,
      "recipient": "TAX7OUHMQSTDXOMYJIKHFILRKOLVYGECG47FPKGQ",
      "recipientPublicKey": "",
      "isMultisig": false,
      "timeStamp": 101991839,
      "multisigAccount": "",
      "message": "Hello",
      "messageType": 1,
      "mosaics": [] 
    };


    await new Promise((res, rej) => {
      request({
        url: `http://localhost:${config.rest.port}/sign/nem/TAHZD4PLMR4OX3OLNMJCC726PNLXCJMCFWR2JI3D`,
        method: 'POST',
        json: {tx: transferData}
      }, async (err, resp) => {
        if (err || resp.statusCode !== 200) 
          return rej(err || resp);
        const tx = resp.body;
        expect(tx.signature).to.be.eq('wRx6TEshbCUdgnF8KEzcEbwH9SuFv8k5gmuypZz1X5pd3zjNF6vj4EA7bLAmJ7QM7Dou3PRQdHFdF2GQFD4uuw');
        res();
      });
    });

  });
});
