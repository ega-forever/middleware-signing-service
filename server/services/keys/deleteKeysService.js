const dbInstance = require('../../controllers/dbController').get(),
  genericMessages = require('../../factories/messages/genericMessages'),
  keyMessages = require('../../factories/messages/keysMessages');

module.exports = async (req, res) => {

  if (!req.body.address && !_.get(req.body, '0.address'))
    return res.send(keyMessages.badParams);

  if (req.body.address)
    req.body = [req.body.address];

  await dbInstance.models.Keys.destroy({
    where: {
      address: {$in: req.body},
      clientId: req.clientId
    }
  });

  return res.send(genericMessages.success);
};
