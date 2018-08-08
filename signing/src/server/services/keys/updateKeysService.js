const dbInstance = require('../../controllers/dbController').get(),
  Web3 = require('web3'),
  _ = require('lodash'),
  Promise = require('bluebird'),
  web3 = new Web3();

module.exports = async (req, res) => {

  if (!req.body.address)
    return res.send({}); //todo add error

  const masterKey = await dbInstance.models.Keys.findOne({where: {address: req.body.address.toLowerCase()}});

  if(!masterKey || (masterKey.masterKeyAddress && req.body.keys))
    return res.send({}); //todo add error


  if(req.body.keys)
    for(let key of req.body.keys){
      const account = web3.eth.accounts.privateKeyToAccount(key);
      await dbInstance.models.Keys.create({
        privateKey: key,
        address: account.address.toLowerCase(),
        masterKeyAddress: masterKey.address
      });
    }

    if(req.body.owners){
    const allAddresses = [masterKey.address, ...req.body.keys.map(key=> web3.eth.accounts.privateKeyToAccount(key).address.toLowerCase())];
      for (let owner of req.body.owners)
        for(let index of owner.keys){
          const address = allAddresses[index];
          await dbInstance.models.AccountKeys.create({
            address: owner.address.toLowerCase(),
            keyAddress: address
          });
        }
    }



  return res.send({status: 1});
};
