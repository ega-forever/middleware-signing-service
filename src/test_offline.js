let bip39 = require("bip39"),
  bitcoin = require('bitcoinjs-lib');

const mnemonic = 'laptop stand rule match source dinosaur real amazing lobster inflict catalog clap';
const seed = bip39.mnemonicToSeed(mnemonic);

const node = bitcoin.HDNode.fromSeedBuffer(seed, bitcoin.networks.testnet).derivePath("m/44'/0'/0'");

let keyPair = node.derivePath("0/0").keyPair;
let keyPair2 = node.derivePath("0/1").keyPair;
let keyPair3 = node.derivePath("0/2").keyPair;

console.log(keyPair.getAddress().toString('hex'))


const init = async () => {

  const pubKeys = [keyPair, keyPair2, keyPair3].map(key => key.getPublicKeyBuffer());

  const redeemScript = bitcoin.script.multisig.output.encode(2, pubKeys); // 2 of 3
  const scriptPubKey = bitcoin.script.scriptHash.output.encode(bitcoin.crypto.hash160(redeemScript));
  const multisigAddress = bitcoin.address.fromOutputScript(scriptPubKey, bitcoin.networks.testnet);
  console.log(multisigAddress)

  const txb = new bitcoin.TransactionBuilder(bitcoin.networks.testnet);
  txb.addInput('5b28ed668f96155b5fb9f108d794d0ce094dd9018f487b8669ce3a6cd255745a', 1);
  txb.addOutput('mr2fCaYi9xyeypxkEmx2NVCSR7kkb7ZLnT', 55000000 - 5000);

  const keyPairs = [];

  for (let index = 0; index < 2; index++) {
    let keyPair = node.derivePath(`0/${index}`).keyPair;
    console.log(keyPair.getPublicKeyBuffer().toString('hex'))
    keyPairs.push(keyPair);
  }

  for (let i = 0; i < txb.tx.ins.length; i++)
    for (let keyPair of keyPairs) {
      txb.sign(i, keyPair, redeemScript);
    }

  console.log(txb.build().toHex());

  console.log(txb.build().txid)

}


module.exports = init().catch(err=>console.log(err));
