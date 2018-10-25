/**
 * Copyright 2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Egor Zuev <zyev.egor@gmail.com>
 */

const dbInstance = require('../../controllers/dbController').get(),
  hdkey = require('ethereumjs-wallet/hdkey'),
  Wallet = require('ethereumjs-wallet'),
  extractExtendedKey = require('../../utils/crypto/extractExtendedKey'),
  _ = require('lodash');

/**
 * @function
 * @description get client's public keys
 * @param req - request object
 * @param res - response object
 * @return {Promise<*>}
 */
module.exports = async (req, res) => {

  let permissions = await req.client.getPermissions();

  if (req.params.address) {
    if (!_.isArray(req.params.address))
      req.params.address = [req.params.address];

    permissions = _.filter(permissions, permission => req.params.address.includes(permission.KeyAddress));
  }


  let keys = await dbInstance.models.Keys.findAll({
    where: {
      address: {
        $in: permissions.map(permission => permission.KeyAddress)
      }
    },
    include: [{
      model: dbInstance.models.PubKeys
    },
      {
        model: dbInstance.models.VirtualKeyPubKeys,
        include: [{model: dbInstance.models.PubKeys}]
      }]
  });


  keys = _.chain(permissions).groupBy('KeyAddress').toPairs().map(pair => {

    const address = pair[0];
    const permissions = pair[1];
    const isOwner = !!_.find(permissions, {owner: true});

    let key = _.find(keys, {address: address});
    key = key.toJSON();

    const extendedKey = extractExtendedKey(key.privateKey);
    const rootPublicKey = extendedKey ? hdkey.fromExtendedKey(extendedKey).publicExtendedKey() : Wallet.fromPrivateKey(Buffer.from(key.privateKey.replace('0x', ''), 'hex')).getPublicKey().toString('hex');

    const indexes = isOwner ? (key.isStageChild ? [key.pubKeysCount - 1] : _.range(0, key.pubKeysCount)) :
      (key.isStageChild ? [key.pubKeysCount - 1] : permissions.map(permission => permission.deriveIndex));

    if (key.VirtualKeyPubKeys.length) {
      const pubKeys = key.VirtualKeyPubKeys.map(item => ({
        [item.PubKey.blockchain]: item.PubKey.pubKey,
        index: item.PubKey.index
      }));

      return {
        address: key.address,
        pubKeys: pubKeys,
        default: key.default,
        shared: !isOwner,
        info: key.info,
        virtual: true,
        required: key.requiredCount
      };

    }

    const pubKeys = _.chain(key.PubKeys)
      .filter(key => indexes.includes(key.index))
      .groupBy('index')
      .toPairs()
      .map(pair =>
        _.transform(pair[1], (result, item) => {
          result[item.blockchain] = item.pubKey;
        }, {index: parseInt(pair[0])})
      )
      .value();


    return {
      address: key.address,
      rootPubKey: rootPublicKey,
      pubKeys: pubKeys,
      default: key.default,
      shared: !isOwner,
      info: key.info,
      virtual: false
    };

  })
    .thru(keys =>
      req.params.address && !_.isArray(req.params.address) ? _.get(keys, '0', {}) : keys
    )
    .value();

  return res.send(keys);
};
