const dbInstance = require('../../controllers/dbController').get(),
  Web3 = require('web3'),
  _ = require('lodash'),
  web3 = new Web3();

module.exports = async (req, res) => {

  if (!req.body.key && !_.get(req.body, '0.key'))
    return res.send({}); //todo add error

  if (req.body.key)
    req.body = [req.body.key];

  const client = await dbInstance.models.Clients.findOne({where: {clientId: req.clientId}});

  if (!client)
    return res.send({}); //todo add error

  for (let key of req.body) {
    const account = web3.eth.accounts.privateKeyToAccount(key.key);
    await dbInstance.models.Keys.create({
      privateKey: key.key,
      address: account.address.toLowerCase(),
      default: !!key.default
    });

    await dbInstance.models.ClientKeys.create({
      clientId: req.clientId,
      keyAddress: account.address.toLowerCase()
    });
  }


  return res.send({status: 1});
};
