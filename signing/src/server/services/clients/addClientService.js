const dbInstance = require('../../controllers/dbController').get();

module.exports = async (req, res) => {


  if (!req.body.clientId)
    return res.send({}); //todo add error

  const client = await dbInstance.models.Clients.findOne({where: {clientId: req.body.clientId}});

  if (client)
    return res.send({}); //todo add error

  await dbInstance.models.Clients.create({
    clientId: req.body.clientId,
    clientName: req.body.clientName
  });


  return res.send({status: 1});
};
