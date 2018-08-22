let bip39 = require("bip39"),
  bigi = require('bigi'),
  bitcoin = require('bitcoinjs-lib');

const mnemonic = 'laptop stand rule match source dinosaur real amazing lobster inflict catalog clap';
const seed = bip39.mnemonicToSeed(mnemonic);

const node = bitcoin.HDNode.fromSeedBuffer(seed, bitcoin.networks.testnet).derivePath("m/44'/0'/0'");

let keyPair = new bitcoin.ECPair(bigi.fromBuffer(Buffer.from('d9c178f1c1d6a104891701cc61b249979b54edd36277b5014e3b08702bc216e3'.replace('0x', ''), 'hex')), null, {network: bitcoin.networks.testnet});
let keyPair2 = new bitcoin.ECPair(bigi.fromBuffer(Buffer.from('9b9750256014f334f3edb9347f83b37a99fcf393f648ff2690008ad32f486813'.replace('0x', ''), 'hex')), null, {network: bitcoin.networks.testnet});
let keyPair3 = new bitcoin.ECPair(bigi.fromBuffer(Buffer.from('a6623954f174f7068dff432cbb8c83a4d23e5384d42824742eb73dbd20fd9838'.replace('0x', ''), 'hex')), null, {network: bitcoin.networks.testnet});

console.log(keyPair.getAddress().toString('hex'))


const init = async () => {

  const pubKeys = [keyPair, keyPair2, keyPair3].map(key => key.getPublicKeyBuffer());

  const redeemScript = bitcoin.script.multisig.output.encode(2, pubKeys); // 2 of 3
  const scriptPubKey = bitcoin.script.scriptHash.output.encode(bitcoin.crypto.hash160(redeemScript));
  const multisigAddress = bitcoin.address.fromOutputScript(scriptPubKey, bitcoin.networks.testnet);
  console.log(multisigAddress)

  const txb = new bitcoin.TransactionBuilder(bitcoin.networks.testnet);
  txb.addInput('8c6c415cdab1f8addaaf354fade0376cd677c816395e4783e4170f70b409f6f6', 1);
  txb.addOutput('mr2fCaYi9xyeypxkEmx2NVCSR7kkb7ZLnT', 11000000);
  txb.addOutput('2N8tHkwMDzPAL45W95dmDLGiFnUXoMhfBm9', 101036325);

  const keyPairs = [keyPair, keyPair2];

/*  for (let index = 0; index < 2; index++) {
    let keyPair = node.derivePath(`0/${index}`).keyPair;
    console.log(keyPair.getPublicKeyBuffer().toString('hex'))
    keyPairs.push(keyPair);
  }*/

  for (let i = 0; i < txb.tx.ins.length; i++)
    for (let keyPair of keyPairs) {
      txb.sign(i, keyPair, redeemScript);
    }

  console.log(txb.build().toHex());

}


module.exports = init().catch(err => console.log(err));
