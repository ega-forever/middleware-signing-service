class AbstractPlugin {

  constructor() {
    if (new.target === AbstractPlugin)
      throw Error('can\'t init abstract class');
  }

  getPublicKey() {
    throw new Error('the method should be overridden!');
  }

  sign() {
    throw new Error('the method should be overridden!');
  }

}

module.exports = AbstractPlugin;