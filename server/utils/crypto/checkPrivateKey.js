const extractExtendedKey = require('./extractExtendedKey'),
  hdkey = require('ethereumjs-wallet/hdkey');

module.exports = (key) => {

  try {
    const extendedKey = extractExtendedKey(key);

    if (extendedKey)
      hdkey.fromExtendedKey(extendedKey).getWallet().getPrivateKey();
  } catch (e) {
    return false;
  }

  return true;

};
