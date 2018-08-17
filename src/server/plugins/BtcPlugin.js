const AbstractPlugin = require('./abstract/AbstractPlugin'),
  bigi = require('bigi'),
  bitcoin = require('bitcoinjs-lib');

class BtcPlugin extends AbstractPlugin {

  constructor(network) {
    super();
    this.network = bitcoin.networks[network];
  }

  sign(privKey, txParams, options) {

    if (!options.sigRequired)
      options.sigRequired = 2;

    let keyPairs = [];

    if (privKey.length <= 64) {
      keyPairs.push(new bitcoin.ECPair(bigi.fromBuffer(Buffer.from(privKey, 'hex')), null, {network: this.network}));
    } else {
      let node = bitcoin.HDNode.fromBase58(privKey).derivePath("m/44'/0'/0'");

      for (let index = 0; index < options.sigRequired; index++) {
        let keyPair = node.derivePath(`0/${index}`).keyPair;
        keyPair.network = bitcoin.networks.testnet;
        keyPairs.push(keyPair);
      }
    }

    const restoredTxb = bitcoin.TransactionBuilder.fromTransaction(bitcoin.Transaction.fromHex(txParams.incompleteTx), this.network);

    if (!txParams.redeemScript) {
      let keyPair = keyPairs[options.index || 0];

      for (let i = 0; i < restoredTxb.tx.ins.length; i++)
        restoredTxb.sign(i, keyPair);

      return restoredTxb.build().toHex();
    }

    const redeemScript = Buffer.from(txParams.redeemScript, 'hex');

    for (let i = 0; i < restoredTxb.tx.ins.length; i++)
      for (let keyPair of keyPairs)
        restoredTxb.sign(i, keyPair, redeemScript);

    return restoredTxb.build().toHex();
  }

  getPublicKey(privKey, deriveIndex) {

    if (privKey.length <= 64) {
      const keyPair = new bitcoin.ECPair(bigi.fromBuffer(Buffer.from(privKey, 'hex')), null, {network: this.network});
      return keyPair.getPublicKeyBuffer().toString('hex');
    }

    let node = bitcoin.HDNode.fromBase58(privKey).derivePath("m/44'/0'/0'");
    let keyPair = node.derivePath(`0/${deriveIndex}`).keyPair;
    return keyPair.getPublicKeyBuffer().toString('hex');
  }

}

module.exports = BtcPlugin;