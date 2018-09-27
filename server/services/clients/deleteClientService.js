/**
 * Copyright 2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Egor Zuev <zyev.egor@gmail.com>
 */

const dbInstance = require('../../controllers/dbController').get(),
  _ = require('lodash'),
  genericMessages = require('../../factories/messages/genericMessages');

/**
 * @function
 * @description remove exciting client
 * @param req - request object
 * @param res - response object
 * @return {Promise<*>}
 */
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
