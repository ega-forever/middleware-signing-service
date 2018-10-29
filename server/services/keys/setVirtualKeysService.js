/**
 * Copyright 2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Egor Zuev <zyev.egor@gmail.com>
 */

const dbInstance = require('../../controllers/dbController').get(),
  _ = require('lodash'),
  bitcoin = require('bitcoinjs-lib'),
  keyMessages = require('../../factories/messages/keysMessages');

/**
 * @function
 * @description add new virtual key for client
 * @param req - request object
 * @param res - response object
 * @return {Promise<*>}
 */
module.exports = async (req, res, next) => {

  if (!_.isArray(req.body))
    req.body = [req.body];

  let allKeysValid = _.chain(req.body).reject(item => _.isArray(item.keys)).size().eq(0).value();//todo create validator

  if (!allKeysValid)
    return res.send(keyMessages.badParams);

  for (let operation of req.body)

    if (operation.multisig) {

      let keys = await dbInstance.models.Keys.findAll({
        where: {
          address: {
            $in: operation.keys.map(key => key.address)
          }
        }
      });

      let permissions = await req.client.getPermissions({
        where: {
          KeyId: {
            $in: keys.map(key => key.id)
          }
        },
        include: [{
          model: dbInstance.models.Keys,
          required: true
        }]
      });


      for (let key of operation.keys) {
        let permissionsById = _.filter(permissions, permission => permission.Key.address === key.address);
        if (!permissionsById.length)
          return res.send(keyMessages.badParams);

        key.id = permissionsById[0].Key.id;

        if (permissionsById[0].owner)
          continue;

        if (!_.find(permissionsById, {deriveIndex: key.index}))
          return res.send(keyMessages.badParams);
      }

      let pubKeys = await dbInstance.models.PubKeys.findAll({
        where: {
          $or: operation.keys.map(item => ({
            KeyId: item.id,
            index: parseInt(item.index || 0),
            blockchain: operation.blockchain
          }))
        },
        include: [{
          model: dbInstance.models.Keys
        }]
      });

      const sortedKeys = operation.keys.map(key => _.find(pubKeys, {
        KeyId: key.id,
        index: parseInt(key.index || 0)
      }));

      const rawPubKeys = _.chain(sortedKeys).map(item => Buffer.from(item.pubKey, 'hex')).value();
      const redeemScript = bitcoin.script.multisig.output.encode(operation.required || rawPubKeys.length, rawPubKeys);
      const scriptPubKey = bitcoin.script.scriptHash.output.encode(bitcoin.crypto.hash160(redeemScript));
      const multisigAddress = bitcoin.address.fromOutputScript(scriptPubKey, bitcoin.networks.testnet);


      let createdKeyRecord = await dbInstance.models.Keys.create({
        ClientId: req.client.id,
        address: multisigAddress,
        isVirtual: true,
        privateKey: scriptPubKey.toString('hex'),
        info: _.isString(operation.info) ? operation.info : '',
        requiredCount: operation.required || rawPubKeys.length
      });

      for (let index = 0; index < sortedKeys.length; index++)
        await dbInstance.models.VirtualKeyPubKeys.create({
          PubKeyId: sortedKeys[index].id,
          KeyId: createdKeyRecord.id,
          orderIndex: index
        });


      await dbInstance.models.Permissions.create({
        ClientId: req.client.id,
        owner: true,
        deriveIndex: 0,
        KeyId: createdKeyRecord.id
      });

      operation.address = createdKeyRecord.address;

    }

  req.params.address = req.body.map(item=>item.address);

  next();
};
