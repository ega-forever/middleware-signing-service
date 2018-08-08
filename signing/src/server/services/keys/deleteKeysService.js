const dbInstance = require('../../controllers/dbController').get();

module.exports = async (req, res) => {

  if (!req.body.address)
    return res.send({}); //todo add error


  const key = await dbInstance.models.Keys.findOne({where: {address: req.body.address.toLowerCase()}});


  if (req.body.owners) {
    await dbInstance.models.AccountKeys.destroy({
      where: {
        keyAddress: req.body.address,
        address: {
          $in: req.body.owners.map(owner => owner.address)
        }
      }
    });

    return res.send({status: 1});
  }


  const keys = [key];

  if (!key.masterKeyAddress) {
    const childKeys = await dbInstance.models.Keys.findAll({where: {masterKeyAddress: key.address}});
    keys.push(...childKeys);
  }


  await dbInstance.models.AccountKeys.destroy({
    where: {
      keyAddress: {
        $in: keys.map(key => key.address)
      }
    }
  });

  for (let key of keys)
    await key.destroy();


  return res.send({status: 1});
};
