const dbInstance = require('../controllers/dbController').get(),
  genericMessages = require('../factories/messages/genericMessages');

module.exports = async (req, res, next) => {

  req.clientId = req.get('client_id');
  const client = await dbInstance.models.Clients.findOne({where: {clientId: req.clientId}});

  if (!client)
    return res.status(401).send(genericMessages.fail); //todo make error

  next();
};
