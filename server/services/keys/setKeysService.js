/**
 * Copyright 2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Egor Zuev <zyev.egor@gmail.com>
 */

const dbInstance = require('../../controllers/dbController').get(),
  Web3 = require('web3'),
  _ = require('lodash'),
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

  if (!req.body.key && !_.get(req.body, '0.key'))
    return res.send(keyMessages.badParams);

  if (req.body.key)
    req.body = [req.body.key];

  let allKeysValid = _.chain(req.body).map(key => checkPrivateKey(key.key)).filter(eq => !eq).size().eq(0).value();

  if (!allKeysValid)
    return res.send(keyMessages.badParams);

  for (let key of req.body) {

    const extendedKey = extractExtendedKey(key.key);

    if (!extendedKey && key.key.indexOf('0x') === -1)
      key.key = `0x${key.key}`;

    const privateKey = extendedKey ? hdkey.fromExtendedKey(extendedKey).getWallet().getPrivateKey() : key.key;

    const account = web3.eth.accounts.privateKeyToAccount(privateKey);

    let pubKeysRecords = (key.stageChild ? [key.pubKeys - 1] : _.range(0, key.pubKeys)).map(deriveIndex => {
      const pubKeys = _.chain(plugins.plugins).toPairs().transform((result, pair) => {
        result.push({
          blockchain: pair[0],
          pubKey: new pair[1](config.network).getPublicKey(extendedKey || key.key, deriveIndex)
        });
      }, []).value();

      return {
        index: deriveIndex,
        pubKeys: pubKeys
      };
    });

    let keyRecord = await dbInstance.models.Keys.create({
      pubKeysCount: key.pubKeys || 1,
      isStageChild: !!key.stageChild,
      privateKey: extendedKey || key.key,
      info: _.isString(key.info) ? key.info : '',
      address: account.address.toLowerCase(),
      default: !!key.default,
      PubKeys: _.chain(pubKeysRecords).map(pubKeysRecord =>
        pubKeysRecord.pubKeys.map(item => ({
          pubKey: item.pubKey,
          blockchain: item.blockchain,
          index: pubKeysRecord.index
        }))
      )
        .flattenDeep()
        .value()
    }, {
      include: [{
        model: dbInstance.models.PubKeys
      }]
    });


    await dbInstance.models.Permissions.create({
      ClientId: req.client.id,
      owner: true,
      deriveIndex: 0,
      KeyAddress: keyRecord.address
    });

  }


  return res.send(genericMessages.success);
};
