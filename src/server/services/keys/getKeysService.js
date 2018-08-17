const dbInstance = require('../../controllers/dbController').get(),
  plugins = require('../../plugins'),
  config = require('../../config'),
  _ = require('lodash');

module.exports = async (req, res) => {

  let keys = await dbInstance.models.Keys.findAll({where: {clientId: req.clientId}});

  keys = keys.map(key => {
    const pubKeys = [];

    for (let index = key.isStageChild ? key.pubKeysCount - 1 : 0; index < key.pubKeysCount; index++) {
      const pubKey = _.chain(plugins).toPairs().transform((result, pair) => {
        result[pair[0]] = new pair[1](config.network).getPublicKey(key.privateKey, index);
      }, {}).value();

      pubKey.index = index;
      pubKeys.push(pubKey);
    }

    return {
      address: key.address,
      pubKeys: pubKeys,
      default: key.default
    };
  });

  return res.send(keys);
};
