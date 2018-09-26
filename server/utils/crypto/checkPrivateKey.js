const extractExtendedKey = require('./extractExtendedKey'),
  hdkey = require('ethereumjs-wallet/hdkey');

/**
 * @function
 * @description check if private key valid
 * @param key
 * @return {boolean}
 */
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
