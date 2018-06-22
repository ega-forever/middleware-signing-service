/**
 * 
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Kirill Sergeev <cloudkserg11@gmail.com>
 */
const EthereumTx = require('ethereumjs-tx')

module.exports = (privateKey, tx) => {
  const privateKeyHex = Buffer.from(privateKey, 'hex');
  
  const txParams = {
    nonce: tx.nonce || '0x00',
    gasPrice: tx.gasPrice || '0x09184e72a000', 
    gasLimit: tx.gasLimit || '0x2710',
    to: tx.to, 
    value: tx.value, 
    data: tx.data,
    chainId: tx.chainId || 3
  };
  const outTx = new EthereumTx(txParams);
  outTx.sign(privateKeyHex);
  return outTx.serialize();
};
