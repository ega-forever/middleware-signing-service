/**
 * Copyright 2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Egor Zuev <zyev.egor@gmail.com>
 */

/**
 * @factory
 * @description key message factory
 * @type {{
 *    badParams: {
 *      message: string, status: number
 *      },
 *      badOperation: {
 *        message: string, status: number
 *        }
 *    }}
 */

module.exports = {
  badParams: {message: 'bad params has been provided, or some necessary params are missed', status: 200},
  badOperation: {message: 'bad operation provided', status: 201}
};
