/**
 * Copyright 2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Egor Zuev <zyev.egor@gmail.com>
 */

const _ = require('lodash'),
  bip39 = require('bip39');

/**
 * @function
 * @description generate and add new keys for client
 * @param req - request object
 * @param res - response object
 * @param next - next callback
 * @return {Promise<*>}
 */
module.exports = async (req, res, next) => {

  if (!_.isArray(req.body))
    req.body = [req.body];


  req.body = req.body.map(item=>{
    item.key = bip39.generateMnemonic();
    return item;
  });

  next();
};
