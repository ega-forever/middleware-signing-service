const dbInstance = require('../../controllers/dbController').get(),
  plugins = require('../../plugins'),
  config = require('../../config'),
  _ = require('lodash');

module.exports = async (req, res) => {

  let permissions = await req.client.getPermissions();

  let keys = await dbInstance.models.Keys.findAll({
    where: {
      address: {
        $in: permissions.map(permission => permission.KeyAddress)
      }
    }
  });

  keys = _.chain(permissions).groupBy('KeyAddress').toPairs().map(pair => {

    const address = pair[0];
    const permissions = pair[1];
    const isOwner = !!_.find(permissions, {owner: true});

    let key = _.find(keys, {address: address});
    key = key.toJSON();
    key.allowedPubKeys = isOwner ? (key.isStageChild ? [key.pubKeysCount - 1] : _.range(0, key.pubKeysCount)) :
      (key.isStageChild ? [key.pubKeysCount - 1] : permissions.map(permission => permission.deriveIndex));


    const pubKeys = key.allowedPubKeys.map(deriveIndex => {
      const pubKey = _.chain(plugins).toPairs().transform((result, pair) => {
        result[pair[0]] = new pair[1](config.network).getPublicKey(key.privateKey, deriveIndex);
      }, {}).value();

      pubKey.index = deriveIndex;
      return pubKey;
    });

    return {
      address: key.address,
      pubKeys: pubKeys,
      default: key.default
    };

  }).value();

  return res.send(keys);
};
