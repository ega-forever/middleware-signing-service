const EthereumTx = require('ethereumjs-tx'),
  Wallet = require('ethereumjs-wallet'),
  AbstractPlugin = require('./abstract/AbstractPlugin'),
  hdkey = require('ethereumjs-wallet/hdkey');


class EthPlugin extends AbstractPlugin {

  constructor(network) {
    super();
    this.network = network;
  }

  async sign(signers, txParams) {

    let privateKey = signers[0].privateKey;

    if (privateKey.length > 66)
      privateKey = hdkey.fromExtendedKey(privateKey).getWallet().getPrivateKey().toString('hex');

    const privateKeyBuffer = Buffer.from(privateKey.replace('0x', ''), 'hex');
    const tx = new EthereumTx(txParams);
    tx.sign(privateKeyBuffer);
    return {
      messageHash: `0x${tx.hash().toString('hex')}`,
      r: `0x${tx.r.toString('hex')}`,
      s: `0x${tx.s.toString('hex')}`,
      v: `0x${tx.v.toString('hex')}`,
      rawTransaction: `0x${tx.serialize().toString('hex')}`
    };
  }

  getPublicKey(privKey, deriveIndex) {

    if (privKey.length <= 66) {
      const pubkey = Wallet.fromPrivateKey(Buffer.from(privKey.replace('0x', ''), 'hex')).getPublicKey();
      return pubkey.toString('hex');
    }

    const hdwallet = hdkey.fromExtendedKey(privKey);
    const pubKey = hdwallet.derivePath(`m/44'/60'/0'/0/${deriveIndex}`).getWallet().getPublicKey();

    return pubKey.toString('hex');
  }

}

module.exports = EthPlugin;
