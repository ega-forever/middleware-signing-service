const dbInstance = require('../../controllers/dbController').get(),
  genericMessages = require('../../factories/messages/genericMessages'),
  extractExtendedKey = require('../../utils/crypto/extractExtendedKey'),
  plugins = require('../../plugins'),
  config = require('../../config'),
  keyMessages = require('../../factories/messages/keysMessages'),
  _ = require('lodash');

module.exports = async (req, res) => {

  if (!req.body.address && !_.get(req.body, '0.address'))
    return res.send(keyMessages.badParams);

  if (req.body.address)
    req.body = [req.body];

  let permissions = await req.client.getPermissions();

  let permissionAddresses = permissions.map(permission => permission.KeyAddress);

  const keys = await dbInstance.models.Keys.findAll({
    where: {
      address: {
        $in: _.chain(permissions)
          .map(permission => permission.KeyAddress)
          .filter(address => permissionAddresses.includes(address))
          .value()
      }
    }
  });

  const badRule = _.find(req.body, operation => {
    let key = _.find(keys, {address: operation.address});

    return !key || (!extractExtendedKey(key.privateKey) && (!!operation.stageChild || operation.incrementChild > 0));
  });

  if (badRule)
    return res.send(Object.assign({operation: badRule}, keyMessages.badOperation));

  for (let operation of req.body) {

    let key = await dbInstance.models.Keys.findOne({
      where: {
        address: operation.address
      }
    });

    if (!key)
      continue;

    key.isStageChild = !!operation.stageChild || operation.incrementChild > 0;

    if (operation.incrementChild)
      key.pubKeysCount = (key.pubKeysCount || 1) + operation.incrementChild;

    if (!operation.stageChild && !operation.incrementChild && operation.pubKeys)
      key.pubKeysCount = operation.pubKeys;

    if (operation.default) {


      let ownerAddresses = _.chain(permissions)
        .filter({owner: true})
        .map(permission => permission.KeyAddress)
        .value();

      key.default = true;
      await dbInstance.models.Keys.update({
        default: false
      }, {
        where: {
          address: {
            $in: ownerAddresses
          }
        }
      });
    }

    let pubKeysRecords = (key.isStageChild ? [key.pubKeysCount - 1] : _.range(0, key.pubKeysCount)).map(deriveIndex => {
      const pubKeys = _.chain(plugins.plugins).toPairs().transform((result, pair) => {
        result.push({
          blockchain: pair[0],
          pubKey: new pair[1](config.network).getPublicKey(key.privateKey, deriveIndex)
        });
      }, []).value();

      return {
        index: deriveIndex,
        pubKeys: pubKeys
      };
    });

    await dbInstance.models.PubKeys.destroy({where: {KeyAddress: key.address}});

    for (let pubKeysRecord of pubKeysRecords)
      for (let item of pubKeysRecord.pubKeys)
        await dbInstance.models.PubKeys.create({
          KeyAddress: key.address,
          pubKey: item.pubKey,
          blockchain: item.blockchain,
          index: pubKeysRecord.index
        });

    if (operation.share && operation.clientId) {

      const client = await dbInstance.models.Clients.findOne({where: {clientId: operation.clientId}});

      await dbInstance.models.Permissions.destroy({
        where: {
          ClientId: client.id,
          KeyAddress: key.address
        }
      });


      if (!operation.children)
        operation.children = pubKeysRecords.map(item => item.index);

      if (client)
        for (let index of operation.children)
          await dbInstance.models.Permissions.create({
            ClientId: client.id,
            owner: false,
            deriveIndex: index,
            KeyAddress: key.address
          });


    }


    await key.save();
  }


  return res.send(genericMessages.success);
};
