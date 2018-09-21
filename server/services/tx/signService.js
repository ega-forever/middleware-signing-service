const plugins = require('../../plugins'),
  config = require('../../config'),
  signMessages = require('../../factories/messages/signMessages'),
  _ = require('lodash'),
  dbInstance = require('../../controllers/dbController').get();

module.exports = async (req, res) => {

  if (!plugins.plugins[req.params.blockchain] || !req.body.payload)
    return res.send(signMessages.wrongPayload);

  let permissions = await req.client.getPermissions();

  let keys = req.body.signers ? await dbInstance.models.Keys.findAll({
      where: {
        address: {
          $in: _.intersection(permissions.map(permission => permission.KeyAddress.toLowerCase()), req.body.signers.map(signers => signers.toLowerCase()))
        }
      }
    }) :
    [await dbInstance.models.Keys.findOne({where: {clientId: req.client.clientId, default: true}})];

  if (!_.compact(keys).length)
    return res.send(signMessages.wrongKey);

  const plugin = new plugins.plugins[req.params.blockchain](config.network);
  keys = keys.map(key => key.toJSON());

  if (req.body.signers)
    keys = _.chain(req.body.signers)
      .map(signer => _.find(keys, {address: signer}))
      .compact()
      .value();

  let tx = await plugin.sign(keys, req.body.payload, req.body.options);

  return res.send({rawTx: tx});
};
