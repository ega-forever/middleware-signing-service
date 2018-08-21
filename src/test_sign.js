let request = require('request'),
  _ = require('lodash'),
  bitcoin = require('bitcoinjs-lib');

require('bitcoinjs-testnets').register(bitcoin.networks);

const init = async () => {

  const data = await new Promise(res => {
    request({
      url: 'http://localhost:8080/keys',
      method: 'GET',
      json: true,
      headers: {
        client_id: 'test_client'
      }
    }, (err, resp) => {
      res(resp.body);
    });
  });

  const pubKeys = _.chain(data).map(item => Buffer.from(item.pubKeys[0].btc, 'hex')).value();

  const redeemScript = bitcoin.script.multisig.output.encode(2, pubKeys); // 2 of 3
  const scriptPubKey = bitcoin.script.scriptHash.output.encode(bitcoin.crypto.hash160(redeemScript));
  const multisigAddress = bitcoin.address.fromOutputScript(scriptPubKey, bitcoin.networks.testnet);
  console.log(multisigAddress);

  const txb = new bitcoin.TransactionBuilder(bitcoin.networks.testnet);
  txb.addInput('34e9144e869eb47f72d58b49d762197ae4832c189bb32557ea79b19b904a3c5c', 1);
  txb.addOutput('n4pVwHkTnspkcyQwnMm4vhWm9XkHhmYb3x', 1200000);
  txb.addOutput('2N8tHkwMDzPAL45W95dmDLGiFnUXoMhfBm9', 35315125);

  const redeemScriptHex = redeemScript.toString('hex');
  const incompleteTx = txb.buildIncomplete().toHex();

  const reply = await new Promise(res => {
    request({
      url: 'http://localhost:8080/tx/bch',
      method: 'POST',
      json: {
        signers: data.map(item => item.address),
        payload: {
          redeemScript: redeemScriptHex,
          incompleteTx: incompleteTx
        },
        /*        options: {
                  useKeys: {
                    [data[0].address]: [0, 1],
                    [data[1].address]: [0]
                  }
                }*/
      },
      headers: {
        client_id: 'test_client'
      }
    }, (err, resp) => {
      res(resp.body);
    });
  });

  console.log(reply);

  const goodTx= '01000000015c3c4a909bb179ea5725b39b182c83e47a1962d7498bd5727fb49e864e14e93401000000fdfd0000483045022100c3d1298226334cfff8088aaaa7a31cebbdf69beb27b657fcb63b0800706a539a022053807e5b89c6594eb6a13c0e1172e6a307bb7493a1d05f81003f8214e317cca20147304402204714798ea0c248496515a192448ef7d38b4e404289bf3b45b02d492a671d423f02207208c87d94fee030be32ac849f89096f365fd7eebd338bce594e905adf333b52014c6952210255aab30e46482a2154e7796f7507a2f6dae5dbba96b7bb75bb46e0ebbbf2cb0a21031e62d58b5d3fca7d0639e538805bfe46a7a63429d65a4bbd497e0f115806be7b21028f93c52785e9e89d68565ef7224b7099068a93b2b2bacbe324e51fe0dc75e97253aeffffffff03804f1200000000001976a914ff9c60b65d21cef5fb747e1dd2cbb8c8ceab82e688acb5dd1a020000000017a914ab8c6c9e7304ae9d66723c3e84822871897b9ad1870000000000000000446a4230786364653063383465666132626430336233333239386139383361666231643934306261366662376162666666333138393762376363666630313764386363663000000000';

  const reply2 = await new Promise(res => {
    request({
      url: 'https://test-bch-insight.bitpay.com/api/tx/send',
      method: 'POST',
      json: {
        rawtx: reply.rawTx
      }
    }, (err, resp) => {
      res(resp.body);
    });
  });


  console.log(reply2);

};


module.exports = init();
