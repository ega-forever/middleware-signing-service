const dbInstance = require('../../controllers/dbController').get(),
  genericMessages = require('../../factories/messages/genericMessages'),
  _ = require('lodash'),
  keyMessages = require('../../factories/messages/keysMessages');

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

    await dbInstance.models.PubKeys.destroy({
      where: {
        KeyAddress: group.address
      }
    });

  }


  return res.send(genericMessages.success);
};
