const dbInstance = require('../../controllers/dbController').get(),
  _ = require('lodash');

module.exports = async (req, res) => {

  const masterKeys = await dbInstance.models.Keys.findAll({where: {masterKeyAddress: null}});

  const items = [];

  for (let masterKey of masterKeys) {

    let item = {
      keyAddresses: [masterKey.address],
      owners: []
    };

    const childKeys = await dbInstance.models.Keys.findAll({
      where: {
        masterKeyAddress: masterKey.address
      }
    });

    if (childKeys.length)
      item.keyAddresses.push(...childKeys.map(key => key.address));

    const owners = await dbInstance.models.AccountKeys.findAll({
      where: {
        keyAddress: {$in: item.keyAddresses}
      }
    });

    item.owners = _.chain(owners)
      .groupBy('address')
      .toPairs()
      .map(pair => ({
        address: pair[0],
        keys: _.chain(pair[1])
          .map(ownerItem => item.keyAddresses.indexOf(ownerItem.keyAddress))
          .sort()
          .value()
      }))
      .value();


    items.push(item)
  }


  return res.send(items);
};
