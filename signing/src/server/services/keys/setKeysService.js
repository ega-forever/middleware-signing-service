const dbInstance = require('../../controllers/dbController').get(),
  Web3 = require('web3'),
  _ = require('lodash'),
  web3 = new Web3();

module.exports = async (req, res) => {

  if (!req.body.keys)
    return res.send({}); //todo add error

  const masterKeyAccountAddress = web3.eth.accounts.privateKeyToAccount(req.body.keys[0]).address.toLowerCase();

  for (let i = 0; i < req.body.keys.length; i++) {
    const account = web3.eth.accounts.privateKeyToAccount(req.body.keys[i]);
    await dbInstance.models.Keys.create({
      privateKey: req.body.keys[i],
      address: account.address.toLowerCase(),
      masterKeyAddress: i === 0 ? null : masterKeyAccountAddress
    });

  }


  if (!req.body.owners)
    req.body.owners = [];


  if (!_.find(req.body.owners, owner => owner.address.toLowerCase() === masterKeyAccountAddress))
    req.body.owners.push({
      address: masterKeyAccountAddress,
      keys: req.body.keys.map((key, index) => index)
    });


  for (let owner of req.body.owners)
    for(let index of owner.keys){
      const address = web3.eth.accounts.privateKeyToAccount(req.body.keys[index]).address.toLowerCase();
      await dbInstance.models.AccountKeys.create({
        address: owner.address.toLowerCase(),
        keyAddress: address
      });
    }

  return res.send({status: 1});
};
