const bip39 = require('bip39'),
  hdkey = require('ethereumjs-wallet/hdkey');

module.exports = (key) => {

  if (key.match(/\S+/g).length === 12) { //mnemonic
    let hdwallet = hdkey.fromMasterSeed(bip39.mnemonicToSeed(key));
    return hdwallet.privateExtendedKey();
  }

  return key.length <= 66 ? null : key;
};
