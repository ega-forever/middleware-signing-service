const dbInstance = require('../../controllers/dbController').get(),
  genericMessages = require('../../factories/messages/genericMessages'),
  extractExtendedKey = require('../../utils/crypto/extractExtendedKey'),
  keyMessages = require('../../factories/messages/keysMessages'),
  _ = require('lodash');

module.exports = async (req, res) => {

  if (!req.body.address && !_.get(req.body, '0.address'))
    return res.send(keyMessages.badParams);

  if (req.body.address)
    req.body = [req.body];


  const keys = await dbInstance.models.Keys.findAll({
    where: {
      address: req.body.map(operation => operation.address)
    }
  });

  const badRule = _.find(req.body, operation => {
    let key = _.find(keys, {address: operation.address});

    return !key || (!extractExtendedKey(key.privateKey) && (!!operation.stageChild || operation.incrementChild > 0));
  });

  if(badRule)
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
      key.default = true;
      await dbInstance.models.Keys.update({
        default: false
      }, {
        where: {
          clientId: req.clientId
        }
      });
    }

    await key.save();
  }


  return res.send(genericMessages.success);
};
