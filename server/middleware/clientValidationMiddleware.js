/**
 * Copyright 2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Egor Zuev <zyev.egor@gmail.com>
 */

const dbInstance = require('../controllers/dbController').get(),
  _ = require('lodash'),
  genericMessages = require('../factories/messages/genericMessages');

/**
 * @description express middleware for handling clients
 * @param req - the request object
 * @param res - the response object
 * @param next - the next function
 */
module.exports = async (req, res, next) => {

  if (!_.has(res, 'locals.data.userId'))
    return res.status(401).send(genericMessages.fail); //todo make error

  req.client = await dbInstance.models.Clients.findOne({where: {clientId: res.locals.data.userId}});

  if (!req.client)
    req.client = await dbInstance.models.Clients.create({
      clientId: res.locals.data.userId,
      clientName: _.get(res, 'locals.data.userName', res.locals.data.userId)
    });

  next();
};
