const dbInstance = require('../controllers/dbController').get();

module.exports = async (req, res, next) => {

  req.clientId = req.get('client_id');
  const client = await dbInstance.models.Clients.findOne({where: {clientId: req.clientId}});

  if (!client)
    return res.status(401).send({status: 0}); //todo make error

  next();
};
