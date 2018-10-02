const AbstractPlugin = require('./abstract/AbstractPlugin'),
  _ = require('lodash'),
  nem = require('nem-sdk').default,
  xor = require('buffer-xor'),
  hdkey = require('ethereumjs-wallet/hdkey');

class NemPlugin extends AbstractPlugin {

  constructor (network) {
    super();

    this.networksMap = {
      main: nem.model.network.data.mainnet.id,
      testnet: nem.model.network.data.testnet.id,
      regtest: nem.model.network.data.testnet.id
    };

    this.network = this.networksMap[network];
    this.derivePurpose = 43;
  }


  _getKeyPair (privateKey) {
    privateKey = privateKey.replace('0x', '');

    const part1 = Buffer.from(privateKey.substr(0, 64), 'hex');
    const part2 = Buffer.from(privateKey.substr(64, 64), 'hex');
    const hex = xor(part1, part2).toString('hex');
    return nem.crypto.keyPair.create(hex);
  }

  /**
   * @function
   * @description sign the transaction
   * @param signers - private keys objects
   * @param txParams - transaction params
   * @return {*}
   */
  async sign (signers, txParams) {

    let privateKey = signers[0].privateKey;

    if (privateKey.length > 66)
      privateKey = hdkey.fromExtendedKey(privateKey).getWallet().getPrivateKey().toString('hex');

    const keyPair = this._getKeyPair(privateKey);
    const common = nem.model.objects.create('common')('', keyPair.privateKey);

    return nem.model.transactions.prepare(txParams.type)(common, txParams.tx, this.network);
  }

  /**
   * @function
   * @description return derived public key from master private key
   * @param privKey - master private key
   * @param deriveIndex - derive index
   * @return {*}
   */
  getPublicKey (privKey, deriveIndex) {

    if (privKey.length <= 66) {
      let keyPair = this._getKeyPair(privKey);
      return keyPair.publicKey.toString();
    }

    const hdwallet = hdkey.fromExtendedKey(privKey);


    if (_.isArray(deriveIndex))
      return deriveIndex.map(index => {
        let privKey = hdwallet.derivePath(`m/44'/${this.derivePurpose}'/0'/0/${index}`).getWallet().getPrivateKey().toString('hex');
        let keyPair = this._getKeyPair(privKey);
        return keyPair.publicKey.toString();
      });


    privKey = hdwallet.derivePath(`m/44'/${this.derivePurpose}'/0'/0/${deriveIndex}`).getWallet().getPrivateKey().toString('hex');
    let keyPair = this._getKeyPair(privKey);
    return keyPair.publicKey.toString();
  }

}

module.exports = NemPlugin;
