let request = require('request'),
  bip39 = require('bip39'),
  bitcoin = require('bitcoinjs-lib');


const init = async () => {

  const mnemonic = 'laptop stand rule match source dinosaur real amazing lobster inflict catalog clap';
  const seed = bip39.mnemonicToSeed(mnemonic);

  const node = bitcoin.HDNode.fromSeedBuffer(seed, bitcoin.networks.testnet).derivePath("m/44'/0'/0'");

  let keyPair = node.derivePath("0/0").keyPair;

  console.log(keyPair.getAddress().toString('hex'));

  const txb = new bitcoin.TransactionBuilder(bitcoin.networks.testnet);
  txb.addInput('cd0f267621f9cb89b10b17ed2058b6fb7b5e8c82c4431cf96b5b0bf62f05e337', 1);
  txb.addOutput('mimG9ndEiseJJgETcj2LArNPn2WvaKeMR7', 55000000 - 5000);

  const incompleteTx = txb.buildIncomplete().toHex();

  const reply = await new Promise(res => {
    request({
      url: `http://localhost:8080/tx/btc`,
      method: 'POST',
      json: {
        singer: "0x7f2ba8fa3cc75ef6066f04d04cfc990c3f1a723d",
        payload: {
          incompleteTx: incompleteTx
        }
      },
      headers: {
        client_id: 'test_client'
      }
    }, async (err, resp) => {
      res(resp.body);
    });
  });


  const reply2 = await new Promise((res) => {
    request({
      url: `https://testnet.blockexplorer.com/api/tx/send`,
      method: 'POST',
      json: {
        rawtx: reply.rawTx
      }
    }, async (err, resp) => {
      res(resp.body);
    });
  });


  console.log(reply2);

};


module.exports = init();
