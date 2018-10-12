/**
 * Copyright 2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Egor Zuev <zyev.egor@gmail.com>
 */

const dbInstance = require('../../controllers/dbController').get(),
  Web3 = require('web3'),
  _ = require('lodash'),
  bitcoin = require('bitcoinjs-lib'),
  genericMessages = require('../../factories/messages/genericMessages'),
  keyMessages = require('../../factories/messages/keysMessages'),
  hdkey = require('ethereumjs-wallet/hdkey'),
  plugins = require('../../plugins'),
  config = require('../../config'),
  extractExtendedKey = require('../../utils/crypto/extractExtendedKey'),
  checkPrivateKey = require('../../utils/crypto/checkPrivateKey'),
  web3 = new Web3();

/**
 * @function
 * @description add new keys for client
 * @param req - request object
 * @param res - response object
 * @return {Promise<*>}
 */
module.exports = async (req, res) => {

  if (!_.isArray(req.body))
    req.body = [req.body];

  /*let allKeysValid = _.chain(req.body).map(key => checkPrivateKey(key.key)).filter(eq => !eq).size().eq(0).value();//todo create validator

  if (!allKeysValid)
    return res.send(keyMessages.badParams);*/

  for (let operation of req.body) {

    if(operation.multisig){


      let pubKeys = await dbInstance.models.PubKeys.findAll({
        where: {
          $or: operation.keys.map(item => ({
            KeyAddress: item.address,
            index: parseInt(item.index || 0),
            blockchain: operation.blockchain
          }))
        },
        include: [{
          model: dbInstance.models.Keys
        }]
      });

      const sortedKeys = operation.keys.map(key => _.find(pubKeys, {KeyAddress: key.address}));

      const rawPubKeys = _.chain(sortedKeys).map(item => Buffer.from(item.pubKey, 'hex')).value();
      const redeemScript = bitcoin.script.multisig.output.encode(operation.required || rawPubKeys.length, rawPubKeys);
      const scriptPubKey = bitcoin.script.scriptHash.output.encode(bitcoin.crypto.hash160(redeemScript));
      const multisigAddress = bitcoin.address.fromOutputScript(scriptPubKey, bitcoin.networks.testnet);


      await dbInstance.models.Keys.create({
        address: multisigAddress,
        isVirtual: true,
        privateKey: scriptPubKey.toString('hex')
      });


      for (let key of sortedKeys)
        await dbInstance.models.VirtualKeyPubKeys.create({
          PubKeyId: key.id,
          KeyAddress: multisigAddress
        });


      await dbInstance.models.Permissions.create({
        ClientId: req.client.id,
        owner: true,
        deriveIndex: 0,
        KeyAddress: multisigAddress
      });


    }

  }


  return res.send(genericMessages.success);
};
