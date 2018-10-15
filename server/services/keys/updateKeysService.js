/**
 * Copyright 2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Egor Zuev <zyev.egor@gmail.com>
 */

const dbInstance = require('../../controllers/dbController').get(),
  genericMessages = require('../../factories/messages/genericMessages'),
  extractExtendedKey = require('../../utils/crypto/extractExtendedKey'),
  plugins = require('../../plugins'),
  config = require('../../config'),
  keyMessages = require('../../factories/messages/keysMessages'),
  _ = require('lodash');

/**
 * @function
 * @description update exciting private key
 * @param req - request object
 * @param res - response object
 * @return {Promise<*>}
 */
module.exports = async (req, res) => {

  if (!req.body.address && !_.get(req.body, '0.address'))
    return res.send(keyMessages.badParams);

  if (req.body.address)
    req.body = [req.body];

  let permissions = await req.client.getPermissions();

  let permissionAddresses = _.chain(permissions).filter({owner: true}).map(permission => permission.KeyAddress).value();

  const keys = await dbInstance.models.Keys.findAll({
    where: {
      address: {
        $in: _.chain(permissions)
          .map(permission => permission.KeyAddress)
          .filter(address => permissionAddresses.includes(address))
          .value()
      },
      isVirtual: false
    }
  });

  const badRule = _.find(req.body, operation => {
    let key = _.find(keys, {address: operation.address});

    return !key || (!extractExtendedKey(key.privateKey) && (!!operation.stageChild || operation.incrementChild > 0));
  });

  if (badRule)
    return res.send(Object.assign({operation: badRule}, keyMessages.badOperation));

  for (let operation of req.body) {

    let key = await dbInstance.models.Keys.findOne({
      where: {
        address: operation.address
      },
      include: {
        model: dbInstance.models.PubKeys
      }
    });

    if (!key)
      continue;

    key.isStageChild = !!operation.stageChild || operation.incrementChild > 0;

    if (operation.incrementChild)
      key.pubKeysCount = (key.pubKeysCount || 1) + operation.incrementChild;

    if (!operation.stageChild && !operation.incrementChild && operation.pubKeys)
      key.pubKeysCount = operation.pubKeys;

    if (_.isString(operation.info))
      key.info = operation.info;

    if (operation.default) {


      let ownerAddresses = _.chain(permissions)
        .filter({owner: true})
        .map(permission => permission.KeyAddress)
        .value();

      key.default = true;
      await dbInstance.models.Keys.update({
        default: false
      }, {
        where: {
          address: {
            $in: ownerAddresses
          }
        }
      });
    }

    if (operation.stageChild || operation.incrementChild || operation.pubKeys) {

      if (operation.pubKeys) {

        let maxIndex = _.chain(key.PubKeys)
          .map(pubkey => pubkey.index)
          .max()
          .value();

        if (maxIndex + 1 > operation.pubKeys) {
          let count = await dbInstance.models.VirtualKeyPubKeys.count({
            where: {

              PubKeyId: {
                $in: _.chain(key.PubKeys)
                  .filter(pubkey => pubkey.index + 1 > operation.pubKeys)
                  .map(pubkey => pubkey.id)
                  .value()
              }
            }
          });

          if (count > 0)
            return res.send(keyMessages.badParams); //todo write error
        }

      }


      let createIndexes = _.chain(key.PubKeys)
        .map(pubkey => pubkey.index)
        .max()
        .thru(max => max + 1 > key.pubKeysCount ? [] : key.isStageChild ? [key.pubKeysCount - 1] : _.range(max + 1, key.pubKeysCount + 1))
        .value();

      let pubKeysRecords = createIndexes.map(deriveIndex => {
        const pubKeys = _.chain(plugins.plugins).toPairs().transform((result, pair) => {
          result.push({
            blockchain: pair[0],
            pubKey: new pair[1](config.network).getPublicKey(key.privateKey, deriveIndex)
          });
        }, []).value();

        return {
          index: deriveIndex,
          pubKeys: pubKeys
        };
      });


      let deleteIndexes = _.chain(key.PubKeys)
        .map(pubkey => pubkey.index)
        .max()
        .thru(max => key.isStageChild ? _.range(0, key.pubKeysCount) : (operation.pubKeys > max + 1 ? [] : _.range(operation.pubKeys, max + 1)))
        .value();

      if (deleteIndexes.length)
        await dbInstance.models.PubKeys.destroy({where: {KeyAddress: key.address, index: {$in: deleteIndexes}}});

      for (let pubKeysRecord of pubKeysRecords)
        for (let item of pubKeysRecord.pubKeys)
          await dbInstance.models.PubKeys.create({
            KeyAddress: key.address,
            pubKey: item.pubKey,
            blockchain: item.blockchain,
            index: pubKeysRecord.index
          });

    }


    if (operation.share && operation.clientId && operation.clientId !== req.client.clientId) {

      const client = await dbInstance.models.Clients.findOne({where: {clientId: operation.clientId}});

      let excitingPermissions = await dbInstance.models.Permissions.findAll({
        where: {
          ClientId: client.id,
          KeyAddress: key.address
        }
      });

      if (!operation.children)
        operation.children = [];


      let addKeyIndexes = _.chain(0)
        .range(key.pubKeysCount + 1)
        .filter(index => operation.children.length ? operation.children.includes(index) : false)
        .reject(index => _.find(excitingPermissions, {deriveIndex: index}))
        .value();


      let removeKeyIndexes = _.chain(0)
        .range(key.pubKeysCount + 1)
        .reject(index => operation.children.length ? operation.children.includes(index) : false)
        .filter(index => _.find(excitingPermissions, {deriveIndex: index}))
        .value();

      if (client && removeKeyIndexes.length)
        await dbInstance.models.Permissions.destroy({
          where: {
            ClientId: client.id,
            KeyAddress: key.address,
            deriveIndex: {
              $in: removeKeyIndexes
            }
          }
        });

      if (client && addKeyIndexes.length)
        for (let index of addKeyIndexes)
          await dbInstance.models.Permissions.create({
            ClientId: client.id,
            owner: false,
            deriveIndex: index,
            KeyAddress: key.address
          });


    }


    await key.save();
  }


  return res.send(genericMessages.success);
};
