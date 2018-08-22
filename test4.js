let bip39 = require("bip39"),
  bip32 = require('bip32'),
  base58check = require('bs58check'),
  bitcoin = require('bitcoinjs-lib'),
  hdkey = require('ethereumjs-wallet/hdkey');

const mnemonic = bip39.generateMnemonic(); //generates string
const seed = bip39.mnemonicToSeed(mnemonic);
let hdwallet = hdkey.fromMasterSeed(seed);
const privKey = hdwallet.privateExtendedKey(); //bip32

console.log(privKey);
let node = bitcoin.HDNode.fromBase58(privKey);
node.keyPair.network = bitcoin.networks.testnet;
console.log(node.keyPair.toWIF())



const xpubString = bitcoin.HDNode.fromSeedBuffer(seed, bitcoin.networks.testnet).derivePath("m/44'/0'/0'").neutered().toBase58();

let node2 = node.derivePath("m/44'/0'/0'").derivePath("0/0")/*.neutered().toBase58();*/
node2.keyPair.network = bitcoin.networks.testnet;

let keyPair2 = bitcoin.HDNode.fromBase58(xpubString, bitcoin.networks.testnet).derivePath("0/0").keyPair;
//let keyPair2 = bitcoin.HDNode.fromBase58(xpubString, bitcoin.networks.testnet).derivePath("0/0").keyPair;

console.log(node2.keyPair.getPublicKeyBuffer().toString('hex'));
console.log(keyPair2.getPublicKeyBuffer().toString('hex'));