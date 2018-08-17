const plugins = require('../../plugins'),
  config = require('../../config'),
  signMessages = require('../../factories/messages/signMessages'),
  dbInstance = require('../../controllers/dbController').get();

module.exports = async (req, res) => {

  if (!plugins[req.params.blockchain] || !req.body.payload)
    return res.send(signMessages.wrongPayload);

  const key = req.body.singer ? await dbInstance.models.Keys.findOne({where: {address: req.body.singer.toLowerCase()}}) :
    await dbInstance.models.Keys.findOne({where: {clientId: req.clientId, default: true}});

  if (!key)
    return res.send(signMessages.wrongKey);

  const plugin = new plugins[req.params.blockchain](config.network);
  const options = Object.assign({pubKeysCount: key.pubKeysCount}, req.body.options);
  let tx = await plugin.sign(key.privateKey, req.body.payload, options);

  return res.send({rawTx: tx});
};
