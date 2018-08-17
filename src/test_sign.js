let request = require('request'),
  bitcoin = require('bitcoinjs-lib');

const data = [
  {
    "address": "0x7f2ba8fa3cc75ef6066f04d04cfc990c3f1a723d",
    "pubKeys": [
      {
        "btc": "02ebc042c42cce75ae70c2aee79fd7f746a6b0954ea5a404b74f0d8983e0dc480e",
        "eth": "cc22dc1b6aa7d076b15590cd78cdda3115d62154da97603c02622f42c584ab6005393a7ee6d7c13356182c4d9f48a5901537d5ebe73e9adffeae833a4da16512"
      },
      {
        "btc": "038c654d8ed0cbbd14165f8916a62d8b406f7f12c2cddb4544d869a5a4b9b31583",
        "eth": "1989dc956ce21be09ffadda038a7574b83f9c47164d4e91056c24f37c786d21801f933408112b1ac6d1aa0933273dd5ff769310c2d090d21c9733c3ba55142b7"
      },
      {
        "btc": "03cdf7ec738260a31b00240ee43accecbd508bb3c87573f945155dce534e4f0bb7",
        "eth": "89b87051eea673bfc5999090d09c2b6679771368cdf35847d127baca0a1ba614af5572cf224e3d3722aa3767dd394e643c63750f6bd7e918c69f2c38098e426b"
      }
    ],
    "default": false
  },
  {
    "address": "0xfc981f80d5d5f84396157ad1952b788e5257c4d0",
    "pubKeys": [
      {
        "btc": "0263e7fe48edadb792b0d2eb97eebfddfe0438c322cd546c1404e0e7a20b3ce723",
        "eth": "63e7fe48edadb792b0d2eb97eebfddfe0438c322cd546c1404e0e7a20b3ce7230e518bffabe559e34ffd92adcfba6bbc1454081c7e2efb9ea992ce8b21641108"
      }
    ],
    "default": true
  },
  {
    "address": "0x9d1232b2f2d92cf57bc3d13aea01125c341d5c37",
    "pubKeys": [
      {
        "btc": "037a460de7680a7d1178af15e7139df999d212f0d7f964bbd3d608e9894d7c7da0",
        "eth": "7a460de7680a7d1178af15e7139df999d212f0d7f964bbd3d608e9894d7c7da0a1f843cd26115916dc7359c25f7c916a576f40a9a317baacad9aebd77c7b32bf"
      }
    ],
    "default": false
  }
];


const init = async () => {

  const pubKeys = data[0].pubKeys.map(key => Buffer.from(key.btc, 'hex'));

  const redeemScript = bitcoin.script.multisig.output.encode(2, pubKeys); // 2 of 3
  const scriptPubKey = bitcoin.script.scriptHash.output.encode(bitcoin.crypto.hash160(redeemScript));
  const multisigAddress = bitcoin.address.fromOutputScript(scriptPubKey, bitcoin.networks.testnet);
  console.log(multisigAddress)

  const txb = new bitcoin.TransactionBuilder(bitcoin.networks.testnet);
  txb.addInput('dc13ae7aed542e2c0a8b64ee5abb97f11531657b8509cb566545d5e110ca1f2c', 1);
  txb.addOutput('mr2fCaYi9xyeypxkEmx2NVCSR7kkb7ZLnT', 55000000 - 5000);

  const redeemScriptHex = redeemScript.toString('hex');
  const incompleteTx = txb.buildIncomplete().toHex();

  const reply = await new Promise((res, rej) => {
    request({
      url: `http://localhost:8080/tx/btc`,
      method: 'POST',
      json: {
        singer: "0x7f2ba8fa3cc75ef6066f04d04cfc990c3f1a723d",
        payload: {
          redeemScript: redeemScriptHex,
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

  console.log(reply);

  const reply2 = await new Promise((res, rej) => {
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
