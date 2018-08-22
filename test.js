let bip39 = require("bip39"),
  bip32 = require('bip32'),
  bitcoin = require('bitcoinjs-lib'),
  hdkey = require('ethereumjs-wallet/hdkey');

// Get our mnemonic and create an hdwallet
const mnemonic = bip39.generateMnemonic(); //generates string
//const mnemonic = 'laptop stand rule match source dinosaur real amazing lobster inflict catalog clap';
console.log(mnemonic);
let hdwallet = hdkey.fromMasterSeed(bip39.mnemonicToSeed(mnemonic));

// Get the first account using the standard hd path.
const privKey = hdwallet.privateExtendedKey(); //bip32
console.log(privKey)

const node = bip32.fromBase58(privKey);

console.log(node.publicKey.toString('hex'));

console.log(hdwallet.getWallet().getPublicKey().toString('hex'));



console.log(hdwallet.derivePath(`m/44'/60'/0'/0/${0}`).getWallet().getPublicKey().toString("hex"))
/*console.log(hdwallet.deriveChild(0).getWallet().getAddress().toString("hex"))
console.log(hdwallet.derivePath(wallet_hdpath + "2").getWallet().getAddress().toString("hex"))
*/
