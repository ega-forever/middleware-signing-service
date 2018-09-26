/**
 * Copyright 2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Egor Zuev <zyev.egor@gmail.com>
 */

const packageJson = require('../../../package');

/**
 * @function
 * @description remove exciting client
 * @param req - request object
 * @param res - response object
 * @return {{version: String, uptime: String}}
 */
module.exports = (req, res) => {
  return res.send({
    version: packageJson.version,
    uptime: `${process.uptime()}s`
  });
};
