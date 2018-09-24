const dbInstance = require('../../controllers/dbController').get(),
  _ = require('lodash'),
  genericMessages = require('../../factories/messages/genericMessages');

module.exports = async (req, res) => {

  let permissions = await req.client.getPermissions();

  const permissionOwnerAddresses = _.chain(permissions)
    .filter({owner: true})
    .map(permission=>permission.KeyAddress)
    .value();

  await dbInstance.models.Keys.destroy({
    where: {
      address: {
        $in: permissionOwnerAddresses
      }
    }
  });

  await req.client.destroy();
  return res.send(genericMessages.success);
};
