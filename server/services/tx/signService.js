/**
 * Copyright 2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Egor Zuev <zyev.egor@gmail.com>
 */

const plugins = require('../../plugins'),
  config = require('../../config'),
  signMessages = require('../../factories/messages/signMessages'),
  _ = require('lodash'),
  dbInstance = require('../../controllers/dbController').get();

/**
 * @function
 * @description remove exciting client
 * @param req - request object
 * @param res - response object
 * @return {Promise<*>}
 */
module.exports = async (req, res) => {

  if (!plugins.plugins[req.params.blockchain] || !req.body.payload)
    return res.send(signMessages.wrongPayload);

  let permissions = await req.client.getPermissions();

  let keys = req.body.signers ? await dbInstance.models.Keys.findAll({
      where: {
        address: {
          $in: _.intersection(permissions.map(permission => permission.KeyAddress.toLowerCase()), req.body.signers.map(signers => signers.toLowerCase()))
        }
      }
    }) :
    [await dbInstance.models.Keys.findOne({where: {clientId: req.client.clientId, default: true}})];

  if (!_.compact(keys).length)
    return res.send(signMessages.wrongKey);

  const plugin = new plugins.plugins[req.params.blockchain](config.network);
  keys = keys.map(key => key.toJSON());

  if (req.body.signers)
    keys = _.chain(req.body.signers)
      .map(signer => _.find(keys, {address: signer}))
      .compact()
      .value();


  let sharedKeyPermissions = _.filter(permissions, permission => !permission.owner && req.body.signers.includes(permission.KeyAddress));


  if (_.has(req.body, 'options.useKeys')) {
    for (let address of Object.keys(req.body.options.useKeys)) {

      let keyPermissions = _.filter(permissions, {KeyAddress: address});

      if (!keyPermissions.length) {
        delete req.body.options.useKeys[address];
        continue;
      }

      if (_.find(keyPermissions, {owner: true}))
        continue;

      for (let index of req.body.options.useKeys[address])
        if (!_.find(keyPermissions, {deriveIndex: index}))
          _.pull(req.body.options.useKeys[address], index);


    }
  } else if (sharedKeyPermissions.length) {
    _.chain(sharedKeyPermissions).groupBy('address')
      .toPairs().forEach(pair => {
      if (!_.has(req.body, 'options.useKeys'))
        _.set(req.body, 'options.useKeys', {});
      req.body.options.useKeys[pair[0]] = pair[1].map(item => item.index);
    })
      .value();
  }

  let tx = await plugin.sign(keys, req.body.payload, req.body.options);

  return res.send({rawTx: tx});
};
