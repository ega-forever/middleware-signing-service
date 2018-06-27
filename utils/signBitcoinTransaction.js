/**
 * 
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Kirill Sergeev <cloudkserg11@gmail.com>
 */
const bitcoin = require('bitcoinjs-lib'),
  bigi = require('bigi'),
  _ = require('lodash');


module.exports = (privateKey, tx) => {
  const bigiKey = bigi.fromBuffer(privateKey),
    keyPair = new bitcoin.ECPair(bigiKey),
    txb = new bitcoin.TransactionBuilder();

  _.get(tx, 'inputs', []).map(input => {
    txb.addInput(input.txId, input.vout);
  });
  _.get(tx, 'outputs', []).map(output => {
    txb.addOutput(output.address, output.value);
  });
  txb.sign(0, keyPair);
  
  return {hex: txb.build().toHex()};
};
