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

  let keys = await dbInstance.models.Keys.findAll({
    where: {
      address: {
        $in: req.body
      },
      ClientId: req.client.id
    },
    attributes: ['id']
  });

  keys = keys.map(key => key.id);

  let permissions = await req.client.getPermissions({where: {KeyId: {$in: keys}}});

  if (!permissions.length)
    return res.send(keyMessages.badParams);

  let groupedPermissions = _.chain(permissions)
    .map(permission => permission.toJSON())
    .groupBy('KeyId')
    .toPairs()
    .map(pair => ({
      id: parseInt(pair[0]),
      permissions: pair[1]
    }))
    .value();

  for (let group of groupedPermissions) {
    let isOwner = !!_.find(group.permissions, {owner: true});

    if (!isOwner)
      continue;

    let isVirtual = await dbInstance.models.Keys.count({
      where: {
        id: group.id,
        isVirtual: true
      }
    });

    if (isVirtual)
      continue;

    await dbInstance.models.Keys.destroy({
      where: {
        id: group.id
      }
    });

    await dbInstance.models.Permissions.destroy({
      where: {
        KeyId: group.id
      }
    });

    await dbInstance.models.PubKeys.destroy({
      where: {
        KeyId: group.id
      }
    });

  }


  return res.send(genericMessages.success);
};
