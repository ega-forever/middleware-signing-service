/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Kirill Sergeev <cloudkserg11@gmail.com>
*/
const blockchains = {
    'nem': require('../utils/signNemTransaction'),
    'waves': require('../utils/signWavesTransaction'),
    'eth': require('../utils/signEthTransaction'),
    'bitcoin': require('../utils/signBitcoinTransaction'),
  },
  _ = require('lodash');


module.exports = (signKeys) => {
  const getBlockchainKeys = (blockchain) => _.get(signKeys, blockchain, []);
  const getBlockchainService = (blockchain) => {
    if (!_.has(blockchains, blockchain))
      throw new Error('not found this blockchain ' + blockchain);

    return blockchains[blockchain];
  };

  const getKey = (blockchainKeys, address) => {
    if (!_.has(blockchainKeys, address)) 
      throw new Error('not found key for address ' + address);
    return blockchainKeys[address];
  };

  return async (blockchain, address, tx) => {
    const signTx = getBlockchainService(blockchain);
    const key = getKey(getBlockchainKeys(blockchain), address);
    return await signTx(key, tx);
  };
};
