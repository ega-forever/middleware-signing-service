let bip39 = require("bip39"),
  bip32 = require('bip32'),
  bitcoin = require('bitcoinjs-lib'),
  hdkey = require('ethereumjs-wallet/hdkey');

const mnemonic = bip39.generateMnemonic(); //generates string
const seed = bip39.mnemonicToSeed(mnemonic);
let hdwallet = hdkey.fromMasterSeed(seed);
const privKey = hdwallet.privateExtendedKey(); //bip32


let node = bitcoin.HDNode.fromBase58(privKey).derivePath("m/44'/0'/0'");

let keyPair = node.derivePath("0/0").keyPair;
let keyPair2 =  node.derivePath("0/1").keyPair;

keyPair.network = bitcoin.networks.testnet;
keyPair2.network = bitcoin.networks.testnet;

console.log(keyPair.getPublicKeyBuffer().toString('hex'))
console.log(keyPair2.getPublicKeyBuffer().toString('hex'))

const pubkeys = [keyPair, keyPair2].map((keyPair) => keyPair.getPublicKeyBuffer());


const redeemScript = bitcoin.script.multisig.output.encode(2, pubkeys); // 2 of 3
const scriptPubKey = bitcoin.script.scriptHash.output.encode(bitcoin.crypto.hash160(redeemScript));
const multisigAddress = bitcoin.address.fromOutputScript(scriptPubKey, bitcoin.networks.testnet);

const txb = new bitcoin.TransactionBuilder(bitcoin.networks.testnet);
txb.addInput('9f11849b40e978bb12a294b2f02e287d9def6a3f0f3c503955c40d6026f65b37', 1);
txb.addOutput('mr2fCaYi9xyeypxkEmx2NVCSR7kkb7ZLnT', 1000);

const redeemScriptHex = redeemScript.toString('hex');
const incompleteTx = txb.buildIncomplete().toHex();

//signing service

const restoredTxb3 = bitcoin.TransactionBuilder.fromTransaction(bitcoin.Transaction.fromHex(incompleteTx), bitcoin.networks.testnet);

for (let i = 0; i < restoredTxb3.tx.ins.length; ++i){
  restoredTxb3.sign(i, keyPair, redeemScript);
  restoredTxb3.sign(i, keyPair2, redeemScript);
}


const fullPartialSignedTxHex = restoredTxb3.build().toHex();

console.log(fullPartialSignedTxHex);