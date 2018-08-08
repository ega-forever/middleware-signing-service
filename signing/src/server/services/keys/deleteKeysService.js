const dbInstance = require('../../controllers/dbController').get();

module.exports = async (req, res) => {

  if (!req.body.address)
    return res.send({}); //todo add error


  const key = await dbInstance.models.Keys.findOne({where: {address: req.body.address.toLowerCase()}});
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
