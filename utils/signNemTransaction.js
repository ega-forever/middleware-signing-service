/**
 * 
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Kirill Sergeev <cloudkserg11@gmail.com>
 */
const nem = require('nem-sdk').default;
const Serialization  = nem.utils.serialization;
const KeyPair  = nem.crypto.keyPair;
const Helpers  = nem.utils.helpers;

module.exports = (privateKey, transferTransaction) => {
  // Create an un-prepared transfer transaction object
  //const transferTransaction = nem.model.objects.create('transferTransaction')(tx.recipient, tx.amount, tx.messagePayload);

  const common = nem.model.objects.create('common')('',  privateKey);


  // Prepare the transfer transaction object
  const tx = nem.model.transactions.prepare('transferTransaction')(
    common, 
    transferTransaction, 
    transferTransaction.version || 'testnet'
  );


  let kp = KeyPair.create(Helpers.fixPrivateKey(privateKey));
  let result = Serialization.serializeTransaction(tx);
  tx.signature = kp.sign(result).toString();

  return tx;
};
