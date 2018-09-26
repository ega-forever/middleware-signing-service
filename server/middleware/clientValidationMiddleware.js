/**
 * Copyright 2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Egor Zuev <zyev.egor@gmail.com>
 */

const dbInstance = require('../controllers/dbController').get(),
  genericMessages = require('../factories/messages/genericMessages');

/**
 * @description express middleware for handling clients
 * @param req - the request object
 * @param res - the response object
 * @param next - the next function
 */
module.exports = async (req, res, next) => {

  req.client = await dbInstance.models.Clients.findOne({where: {clientId: req.get('client_id')}});

  if (!req.client)
    return res.status(401).send(genericMessages.fail); //todo make error

  next();
};
