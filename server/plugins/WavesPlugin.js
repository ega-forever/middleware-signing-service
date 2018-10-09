const AbstractPlugin = require('./abstract/AbstractPlugin'),
  _ = require('lodash'),
  WavesAPI = require('@waves/waves-api'),
  hdkey = require('ethereumjs-wallet/hdkey');

class WavesPlugin extends AbstractPlugin {

  constructor (network) {
    super();

    this.networksMap = {
      main: WavesAPI.MAINNET_CONFIG,
      testnet: WavesAPI.TESTNET_CONFIG,
      regtest: WavesAPI.TESTNET_CONFIG
    };

    this.network = this.networksMap[network];
    this.derivePurpose = 0;
  }


  _getKeyPair (privateKey) {
    privateKey = privateKey.replace('0x', '');
    const Waves = WavesAPI.create(this.network);
    const seed = Waves.Seed.fromExistingPhrase(privateKey);
    return seed.keyPair;
  }

  /**
   * @function
   * @description sign the transaction
   * @param signers - private keys objects
   * @param txParams - transaction params
   * @return {*}
   */
  async sign (signers, txParams) { //todo implement

    let privateKey = signers[0].privateKey;

    if (privateKey.length > 66)
      privateKey = hdkey.fromExtendedKey(privateKey).getWallet().getPrivateKey().toString('hex');

    let keyPair = this._getKeyPair(privateKey);
    const Waves = WavesAPI.create(this.network);

    let name = _.chain(Waves.constants).toPairs()
      .find(pair=>pair[0].includes('_TX') && pair[1] === txParams.type)
      .get(0)
      .thru(item=> Waves.constants[`${item}_NAME`])
      .value();

    let tx = await Waves.tools.createTransaction(name, txParams);
    tx.addProof(keyPair.privateKey);

    return await tx.getJSON();
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

module.exports = WavesPlugin;
