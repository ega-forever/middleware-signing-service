/**
 * Copyright 2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Egor Zuev <zyev.egor@gmail.com>
 */

/**
 * @factory
 * @description sign message factory
 * @type {{
 *    wrongPayload: {
 *          message: string, status: number
 *        },
 *        wrongKey: {
 *          message: string, status: number
 *        },
 *        wrongAction: {
 *          message: string, status: number}
 *    }}
 */

module.exports = {
  wrongPayload: {message: 'wrong payload provided', status: 300},
  wrongKey: {message: 'wrong singer address or default key hasn\'t been set up', status: 301},
  wrongAction: {message: 'wrong action is specified', status: 302},
};
