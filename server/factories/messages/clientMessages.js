/**
 * Copyright 2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Egor Zuev <zyev.egor@gmail.com>
 */


/**
 * @factory
 * @description client message factory
 * @type {{
 *    badClientId: {
 *        message: string, status: number
 *        },
*     clientExist: {
*         message: string, status: number
*         }
*     }}
 */

module.exports = {
  badClientId: {message: 'no client id has been provided', status: 100},
  clientExist: {message: 'this client id already exist', status: 101},

};
