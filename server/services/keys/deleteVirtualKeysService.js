/**
 * Copyright 2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Egor Zuev <zyev.egor@gmail.com>
 */

const dbInstance = require('../../controllers/dbController').get(),
  genericMessages = require('../../factories/messages/genericMessages'),
  _ = require('lodash'),
  keyMessages = require('../../factories/messages/keysMessages');

/**
 * @function
 * @description delete exciting client's private key
 * @param req - request object
 * @param res - response object
 * @return {Promise<*>}
 */
module.exports = async (req, res) => {

  if (!req.body.address && !_.get(req.body, '0.address'))
    return res.send(keyMessages.badParams);

  if (req.body.address)
    req.body = [req.body.address];

  let permissions = await req.client.getPermissions({where: {KeyAddress: {$in: req.body}}});

  if (!permissions.length)
    return res.send(keyMessages.badParams);

  let groupedPermissions = _.chain(permissions)
    .map(permission => permission.toJSON())
    .groupBy('KeyAddress')
    .toPairs()
    .map(pair => ({
      address: pair[0],
      permissions: pair[1]
    }))
    .value();

  for (let group of groupedPermissions) {
    let isOwner = !!_.find(group.permissions, {owner: true});

    if (!isOwner)
      continue;

    let isVirtual = await dbInstance.models.Keys.count({
      where: {
        address: group.address,
        isVirtual: true
      }
    });

    if(!isVirtual)
      continue;

    await dbInstance.models.Keys.destroy({
      where: {
        address: group.address
      }
    });

    await dbInstance.models.Permissions.destroy({
      where: {
        KeyAddress: group.address
      }
    });


    await dbInstance.models.VirtualKeyPubKeys.destroy({
      where: {
        KeyAddress: group.address
      }
    });

  }


  return res.send(genericMessages.success);
};
