const dbInstance = require('../../controllers/dbController').get(),
  _ = require('lodash');

module.exports = async (req, res) => {

  let permissions = await req.client.getPermissions();

  let keys = await dbInstance.models.Keys.findAll({
    where: {
      address: {
        $in: permissions.map(permission => permission.KeyAddress)
      }
    },
    include: [{
      model: dbInstance.models.PubKeys
    }]
  });

  keys = _.chain(permissions).groupBy('KeyAddress').toPairs().map(pair => {

    const address = pair[0];
    const permissions = pair[1];
    const isOwner = !!_.find(permissions, {owner: true});

    let key = _.find(keys, {address: address});
    key = key.toJSON();

    const indexes = isOwner ? (key.isStageChild ? [key.pubKeysCount - 1] : _.range(0, key.pubKeysCount)) :
      (key.isStageChild ? [key.pubKeysCount - 1] : permissions.map(permission => permission.deriveIndex));


    const pubKeys = _.chain(key.PubKeys)
      .filter(key => indexes.includes(key.index))
      .groupBy('index')
      .toPairs()
      .map(pair =>
        _.transform(pair[1], (result, item) => {
          result[item.blockchain] = item.pubKey;
        }, {index: parseInt(pair[0])})
      )
      .value();


    return {
      address: key.address,
      pubKeys: pubKeys,
      default: key.default
    };

  }).value();

  return res.send(keys);
};
