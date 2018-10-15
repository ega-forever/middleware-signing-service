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
      isVirtual: true
    }
  });

  const badRule = _.find(req.body, operation => {
    return !_.find(keys, {address: operation.address});
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


    if (_.isString(operation.info))
      key.info = operation.info;

    if (_.isBoolean(operation.share) && operation.clientId && operation.clientId !== req.client.clientId) {

      const client = await dbInstance.models.Clients.findOne({where: {clientId: operation.clientId}});

      let excitingPermission = await dbInstance.models.Permissions.findOne({
        where: {
          ClientId: client.id,
          KeyAddress: key.address
        }
      });

      if (excitingPermission && !operation.share)
        await dbInstance.models.Permissions.destroy({
          where: {
            ClientId: client.id,
            KeyAddress: key.address
          }
        });

      if (!excitingPermission && operation.share)
        await dbInstance.models.Permissions.create({
          ClientId: client.id,
          owner: false,
          deriveIndex: 0,
          KeyAddress: key.address
        });

    }


    await key.save();
  }


  return res.send(genericMessages.success);
};
