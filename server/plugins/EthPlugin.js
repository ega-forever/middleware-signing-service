const EthereumTx = require('ethereumjs-tx'),
  Wallet = require('ethereumjs-wallet'),
  AbstractPlugin = require('./abstract/AbstractPlugin'),
  Promise = require('bluebird'),
  Web3 = require('web3'),
  web3 = new Web3(),
  _ = require('lodash'),
  crypto = require('crypto'),
  hdkey = require('ethereumjs-wallet/hdkey');


class EthPlugin extends AbstractPlugin {

  constructor (network) {
    super();
    this.network = network;
    this.actions = {
      sign2faCall: this.sign2faCall
    };
  }

  async sign (signers, txParams) {

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

  getPublicKey (privKey, deriveIndex) {

    if (privKey.length <= 66) {
      const pubkey = Wallet.fromPrivateKey(Buffer.from(privKey.replace('0x', ''), 'hex')).getPublicKey();
      return pubkey.toString('hex');
    }

    const hdwallet = hdkey.fromExtendedKey(privKey);


    if (_.isArray(deriveIndex))
      return deriveIndex.map(index => {
        let pubKey = hdwallet.derivePath(`m/44'/60'/0'/0/${index}`).getWallet().getPublicKey();
        return pubKey.toString('hex');
      });


    const pubKey = hdwallet.derivePath(`m/44'/60'/0'/0/${deriveIndex}`).getWallet().getPublicKey();
    return pubKey.toString('hex');
  }

  async sign2faCall (signers, payload){

    const secret = await Promise.promisify(crypto.randomBytes)(128);
    const pass = `0x${secret.toString('hex')}`;

    const hash = web3.utils.soliditySha3(
      {
        type: 'bytes',
        value: pass
      }, {
        type: 'address',
        value: payload.sender
      }, {
        type: 'address',
        value: payload.destination
      }, {
        type: 'bytes',
        value: payload.data
      }, {
        type: 'uint256',
        value: payload.value
      }
    );

    let privateKey = signers[0].privateKey;

    if (privateKey.length > 66)
      privateKey = hdkey.fromExtendedKey(privateKey).getWallet().getPrivateKey().toString('hex');

    const signed = web3.eth.accounts.sign(hash, privateKey);

    const { v, r, s } = signed;
    return {
      pass,
      v,
      r,
      s
    };

  }

}

module.exports = EthPlugin;
