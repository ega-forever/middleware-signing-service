/**
 * Copyright 2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Egor Zuev <zyev.egor@gmail.com>
 */

const requireAll = require('require-all'),
  _ = require('lodash'),
  config = require('../config'),
  Promise = require('bluebird'),
  dbInstance = require('../controllers/dbController').get(),
  AbstractPlugin = require('./abstract/AbstractPlugin'),
  plugins = requireAll({
    dirname: __dirname,
    filter: /(.+Plugin)\.js$/,
    map: pluginName => pluginName.replace('Plugin', '').toLowerCase()
  });

const pluginPairs = _.chain(plugins).toPairs().filter(pair => pair[1].prototype instanceof AbstractPlugin).fromPairs().value();

/**
 * @function
 * @description update the pub keys table in sequilize (in case
 * new plugin has been added)
 * @return {Promise<void>}
 */
const updatePubKeys = async () => {

  const keys = await dbInstance.models.Keys.findAll();

  for (let key of keys) {

    let pubKeysRecords = _.chain((key.stageChild ? [key.pubKeysCount - 1] : _.range(0, key.pubKeysCount)))
      .map(deriveIndex => {
        return _.chain(pluginPairs).toPairs().transform((result, pair) => {
          result.push({
            blockchain: pair[0],
            pubKey: new pair[1](config.network).getPublicKey(key.privateKey, deriveIndex),
            KeyAddress: key.address,
            index: deriveIndex
          });
        }, []).value();
      })
      .flattenDeep()
      .value();

    for (let record of pubKeysRecords) {
      let isExist = await dbInstance.models.PubKeys.count({
        where: {
          blockchain: record.blockchain,
          pubKey: record.pubKey
        }
      });

      if (!isExist)
        await dbInstance.models.PubKeys.create(record);
    }

  }
};

/**
 * @function
 * @description update pub keys table (in case old plugin has been removed)
 * @return {Promise<void>}
 */
const removeOutdatedPubKeys = async () => {
  await dbInstance.models.PubKeys.destroy({
    where: {
      blockchain: {
        $notIn: Object.keys(pluginPairs)
      }
    }
  });
};

/**
 * @function
 * @description sync changes (in case we have added / removed plugin)
 * @return {Promise<void>}
 */
const sync = async () => {

  const blockchains = Object.keys(pluginPairs);
  let pubKeysCount = await dbInstance.models.PubKeys.count();

  if (!pubKeysCount)
    return;

  let state = await Promise.map(blockchains, async (blockchain) =>
    await dbInstance.models.PubKeys.count({
      where: {
        blockchain: blockchain
      }
    })
  );

  if (state.includes(0))
    await updatePubKeys();

  let outdatedPubKeysCount = await dbInstance.models.PubKeys.count({
    where: {
      blockchain: {
        $notIn: Object.keys(pluginPairs)
      }
    }
  });

  if (outdatedPubKeysCount)
    await removeOutdatedPubKeys();


};

/**
 * @factory
 * @type {{plugins: *, sync: sync}}
 */
module.exports = {
  plugins: pluginPairs,
  sync: sync
};
