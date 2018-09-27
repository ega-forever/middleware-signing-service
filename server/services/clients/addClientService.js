/**
 * Copyright 2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Egor Zuev <zyev.egor@gmail.com>
 */

const dbInstance = require('../../controllers/dbController').get(),
  clientMessages = require('../../factories/messages/clientMessages'),
  genericMessages = require('../../factories/messages/genericMessages');

/**
 * @function
 * @description add's new client
 * @param req - request object
 * @param res - response object
 * @return {Promise<*>}
 */
module.exports = async (req, res) => {


  if (!req.body.clientId)
    return res.send(clientMessages.badClientId);

  const client = await dbInstance.models.Clients.findOne({where: {clientId: req.body.clientId}});

  if (client)
    return res.send(clientMessages.clientExist);

  await dbInstance.models.Clients.create({
    clientId: req.body.clientId,
    clientName: req.body.clientName
  });


  return res.send(genericMessages.success);
};
