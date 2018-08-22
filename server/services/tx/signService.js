const plugins = require('../../plugins'),
  config = require('../../config'),
  signMessages = require('../../factories/messages/signMessages'),
  _ = require('lodash'),
  dbInstance = require('../../controllers/dbController').get();

module.exports = async (req, res) => {

  if (!plugins[req.params.blockchain] || !req.body.payload)
    return res.send(signMessages.wrongPayload);

  let keys = req.body.signers ? await dbInstance.models.Keys.findAll({
      where: {
        address: {
          $in: req.body.signers.map(signers => signers.toLowerCase())
        }
      }
    }) :
    [await dbInstance.models.Keys.findOne({where: {clientId: req.clientId, default: true}})];

  if (!_.compact(keys))
    return res.send(signMessages.wrongKey);

  const plugin = new plugins[req.params.blockchain](config.network);
  keys = keys.map(key => key.toJSON());

  if (req.body.signers)
    keys = _.chain(req.body.signers)
      .map(signer => _.find(keys, {address: signer}))
      .compact()
      .value();

  let tx = await plugin.sign(keys, req.body.payload, req.body.options);

  return res.send({rawTx: tx});
};
