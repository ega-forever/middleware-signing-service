/**
 * Copyright 2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Egor Zuev <zyev.egor@gmail.com>
 */

const AbstractPlugin = require('./abstract/AbstractPlugin'),
  bigi = require('bigi'),
  _ = require('lodash'),
  bitcoin = require('bitcoinjs-lib');

require('bitcoinjs-testnets').register(bitcoin.networks);


/**
 * @class
 * @description Litecoin plugin
 * @param network - network's alias name (i.e main, testnet, regtest)
 */
class LtcPlugin extends AbstractPlugin {

  constructor (network) {
    super();

    this.networksMap = {
      main: bitcoin.networks.litecoin,
      testnet: bitcoin.networks.litecoin_testnet,
      regtest: bitcoin.networks.regtest
    };

    this.derivePurposeMap = {
      main: 9,
      testnet: 8,
      regtest: 0
    };

    this.network = this.networksMap[network];
    this.derivePurpose = this.derivePurposeMap[network];
  }

  /**
   * @function
   * @description sign the transaction
   * @param signers - private keys objects
   * @param txParams - transaction params
   * @param options - sign options
   * @return {String}
   */
  sign (signers, txParams, options = {}) {

    if (!options.sigRequired)
      options.sigRequired = 2;

    let keyPairs = [];

    for (let signer of signers)
      if (keyPairs.length < options.sigRequired)
        if (signer.privateKey.length <= 66) {
          keyPairs.push(new bitcoin.ECPair(bigi.fromBuffer(Buffer.from(signer.privateKey.replace('0x', ''), 'hex')), null, {network: this.network}));
        } else {
          let node = bitcoin.HDNode.fromBase58(signer.privateKey).derivePath(`m/44'/${this.derivePurpose}'/0'`);

          for (let index = 0; index < signer.pubKeysCount; index++) {

            if (_.get(options, `useKeys.${signer.address}`, [index]).indexOf(index) === -1)
              continue;

            let keyPair = node.derivePath(`0/${index}`).keyPair;
            keyPair.network = this.network;
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

  /**
   * @function
   * @description return derived public key from master private key
   * @param privKey - master private key
   * @param deriveIndex - derive index
   * @return {String}
   */
  getPublicKey (privKey, deriveIndex) {

    if (privKey.length <= 66) {
      const keyPair = new bitcoin.ECPair(bigi.fromBuffer(Buffer.from(privKey.replace('0x', ''), 'hex')), null, {network: this.network});
      return keyPair.getPublicKeyBuffer().toString('hex');
    }

    let node = bitcoin.HDNode.fromBase58(privKey).derivePath(`m/44'/${this.derivePurpose}'/0'`);

    if (_.isArray(deriveIndex))
      return deriveIndex.map(index => {
        let keyPair = node.derivePath(`0/${index}`).keyPair;
        return keyPair.getPublicKeyBuffer().toString('hex');
      });

    let keyPair = node.derivePath(`0/${deriveIndex}`).keyPair;
    return keyPair.getPublicKeyBuffer().toString('hex');
  }

}

module.exports = LtcPlugin;
