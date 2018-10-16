/**
 * Copyright 2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Egor Zuev <zyev.egor@gmail.com>
 */

/**
 * @class AbstractPlugin
 * @description abstract class for plugin creation
 */
class AbstractPlugin {

  constructor () {
    if (new.target === AbstractPlugin)
      throw Error('can\'t init abstract class');
    this.actions = {};
  }

  getPublicKey () {
    throw new Error('the method should be overridden!');
  }

  sign () {
    throw new Error('the method should be overridden!');
  }

}

module.exports = AbstractPlugin;
