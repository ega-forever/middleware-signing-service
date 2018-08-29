const request = require('request'),
  bitcoin = require('bitcoinjs-lib');


const init = async () => {

  const data = await new Promise(res => {
    request({
      url: 'http://localhost:8080/keys',
      method: 'GET',
      json: true,
      headers: {
        client_id: 'exchange_1'
      }
    }, (err, resp) => {
      res(resp.body);
    });
  });


  let publicKey = new Buffer(data[0].pubKeys[0].btc, 'hex');
  let publicKeyHash = bitcoin.crypto.hash160(publicKey);
  let address = bitcoin.address.toBase58Check(publicKeyHash, bitcoin.networks.testnet.pubKeyHash);

  console.log(publicKey.toString('hex'));
  console.log(publicKeyHash.toString('hex'));
  console.log(address);

  const txb = new bitcoin.TransactionBuilder(bitcoin.networks.testnet);
  txb.addInput('e59dbf41d5e67aba8704169aaca95bf8567c000096eda4df6afa305d2373d1f6', 1);
  txb.addOutput('mimG9ndEiseJJgETcj2LArNPn2WvaKeMR7', parseInt(0.06875 * Math.pow(10, 8)) - 5000);

  const incompleteTx = txb.buildIncomplete().toHex();

  console.log(data[0].address);

  const reply = await new Promise(res => {
    request({
      url: 'http://localhost:8080/tx/btc',
      method: 'POST',
      json: {
        signers: [data[0].address],
        payload: {
          incompleteTx: incompleteTx
        },
        options: {
          useKeys: {
            [data[0].address]: [0]
          }
        }
      },
      headers: {
        client_id: 'exchange_1'
      }
    }, (err, resp) => {
      res(resp.body);
    });
  });


  console.log(reply);

  const reply2 = await new Promise((res) => {
    request({
      url: 'https://testnet.blockexplorer.com/api/tx/send',
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
