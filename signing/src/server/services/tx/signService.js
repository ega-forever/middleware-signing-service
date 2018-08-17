const plugins = require('../../plugins'),
  config = require('../../config'),
  dbInstance = require('../../controllers/dbController').get();

module.exports = async (req, res) => {

  if (!plugins[req.params.blockchain] || !req.body.payload)
    return res.send({}); //todo error


  const key = req.body.singer ? await dbInstance.models.Keys.findOne({where: {address: req.body.singer.toLowerCase()}}) :
    await dbInstance.models.Keys.findOne({where: {clientId: req.clientId, default: true}});

  if (!key)
    return res.send({}); //todo error


  const plugin = new plugins[req.params.blockchain](config.network);

  let tx = await plugin.sign(key.privateKey, req.body.payload, key.pubKeysCount);

  console.log(tx)
  return res.send({rawTx: tx});
};