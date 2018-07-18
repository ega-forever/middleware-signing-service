/**
 * 
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Kirill Sergeev <cloudkserg11@gmail.com>
 */
const EthereumTx = require('ethereumjs-tx'),
  _ = require('lodash');

module.exports = (privateKey, tx) => {
  const privateKeyHex = Buffer.from(privateKey, 'hex');
  
  const txParams = _.merge({}, tx, {
    to: tx.to.length === 20 ? tx.to : '0x' + tx.to
  });
  const outTx = new EthereumTx(txParams);
  outTx.sign(privateKeyHex);
  return  {hex: outTx.serialize().toString('hex')};
};
