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
        client_id: 'exchange'
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
  txb.addInput('6708f67105e9cf6b69cb863a678ada9ee4f059433776092ca4071aaa52b1cc32', 0);
  txb.addOutput('2N8tHkwMDzPAL45W95dmDLGiFnUXoMhfBm9', parseInt(0.270 * Math.pow(10, 8)));

  const redeemScriptHex = redeemScript.toString('hex');
  const incompleteTx = txb.buildIncomplete().toHex();

  console.log(data.map(item => item.address))

  const reply = await new Promise(res => {
    request({
      url: 'http://localhost:8080/tx/btc',
      method: 'POST',
      json: {
        signers: data.map(item => item.address),
        payload: {
          redeemScript: redeemScriptHex,
          incompleteTx: incompleteTx
        },
        options: {
          useKeys: {
            [data[0].address]: [0],
            [data[1].address]: [0],
            [data[2].address]: [0]
          }
        }
      },
      headers: {
        client_id: 'exchange'
      }
    }, (err, resp) => {
      res(resp.body);
    });
  });

  console.log(reply);

  const reply2 = await new Promise(res => {
    request({
      url: `https://testnet.blockexplorer.com/api/tx/send`,
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
