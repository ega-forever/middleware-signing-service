/** 
* Copyright 2017–2018, LaborX PTY
* Licensed under the AGPL Version 3 license.
* @author Kirill Sergeev <cloudkserg11@gmail.com>
*/
require('dotenv/config');

const config = require('../config'),
  Promise = require('bluebird'),
  expect = require('chai').expect;


const request = require('request');


describe('core/service-tx', function () { //todo add integration tests for query, push tx, history and erc20tokens


  it('create bitcoin tx and signing', async () => {
    
    const transferData = {
      "inputs" : [
        {
          "txId": "bca25f801addad0524db65ae28101e7507e08e979778542c55f18275f92c2c8b", 
          "vout": 0
        }
      ], "outputs": [
        {
          "address": "17iReumfvS9wALjZTvmcAu45GtxfWfa8Gq", 
          "value": 62500000
        },
        {
          "address": "1GFg71G2r9g6xi1YQ99LRGDpuSYssZokcW", 
          "value": 156250000
        }
      ]
    };

    await new Promise((res, rej) => {
      request({
        url: `http://localhost:${config.rest.port}/sign/bitcoin/RPoB3FSy5S8jfvQNgdM6Eo1ar3iheih4p4`,
        method: 'POST',
        json: transferData
      }, async (err, resp) => {
        if (err || resp.statusCode !== 200) 
          return rej(err || resp);
        const tx = resp.body;
        expect(tx.hex).to.be.eq('01000000018b2c2cf97582f1552c547897978ee007751e1028ae65db2405addd1a805fa2bc000000006b483045022100dbc886159c987b7683c3abf1b3daa28bbb5aab49d3db9a0e479bdd35d3e77e1602202473182e30dbcff31c0007a3a87f5d3b5cb4855d3b3ed8b0835f77c9d1f12f3901210292887d6b6d709fb9a3b772fc01f3449c816796819e73e7cb28456198a9841c91ffffffff02a0acb903000000001976a91449a663918e391b402ea861f194441f78071b524f88ac902f5009000000001976a914a7505a29d514ebd2d0572f38dc1f55dd24fed67888ac00000000');
        res();
      });
    });

  });


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
      timestamp: 1529883845418
    };

    const tx2 = {
            // An arbitrary address; mine, in this example
            recipient: '3Jk2fh8aMBmhCQCkBcUfKBSEEa3pDMkDjCr',
            // ID of a token, or WAVES
            assetId: null,
            // The real amount is the given number divided by 10^(precision of the token)
            amount: 1000,
            // The same rules for these two fields
            feeAsset: null,
            fee: 100000,
            // 140 bytes of data (it's allowed to use Uint8Array here)
            attachment: '',
            timestamp: Date.now()
    };

    const sign = config.nodered.functionGlobalContext.libs.signingService;
    const a = await sign('waves',  '3JfE6tjeT7PnpuDQKxiVNLn4TJUFhuMaaT5', tx2);
    console.log(a);return;


    await new Promise((res, rej) => {
      request({
        url: `http://localhost:${config.rest.port}/sign/waves/3JfE6tjeT7PnpuDQKxiVNLn4TJUFhuMaaT5`,
        method: 'POST',
        json: transferData
      }, async (err, resp) => {
        if (err || resp.statusCode !== 200) 
          return rej(err || resp);
        const tx = resp.body;
        expect(tx).not.to.be.not.null;
        expect(tx.signature).to.be.eq('3ZCAP7PPgtUia8VzNetJEQ3DWZ6XtBb1ophYgyERefAdVYGqFa1Epud22mFwtiAadvBX56GSAKT2njXQr1MhpwCQ');
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
        url: `http://localhost:${config.rest.port}/sign/eth/294f3c4670a56441f3133835a5cbb8baaf010f88`,
        method: 'POST',
        json: transferData
      }, async (err, resp) => {
        if (err || resp.statusCode !== 200) 
          return rej(err || resp);
        const tx = resp.body;
        expect(tx.hex).to.be.eq('f889808609184e72a00082271094000000000000000000000000000000000000000080a47f74657374320000000000000000000000000000000000000000000000000000006000572aa0c86794da2b0ebe25bd8d3db7dff91b12736886e4eefe3096b759110cdb9d1deda057250c335b833ddefb5af531dcd6a25f1f8045b6990d12e7c70025b7e24ed21f');
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
        json: transferData
      }, async (err, resp) => {
        if (err || resp.statusCode !== 200) 
          return rej(err || resp);
        const tx = resp.body;
        expect(tx.signer).to.be.eq('8e997e65732dd0fe1c141fd86a83a41834e2f3971d20e08131469696e6a9fb23');
        res();
      });
    });

  });
  
});
