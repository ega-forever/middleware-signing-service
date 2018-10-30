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

  if (req.body.signers) {

    for (let index = 0; index < req.body.signers.length; index++) {
      if (req.body.signers[index].length <= 42)
        continue;

      let pubKey = await dbInstance.models.PubKeys.findOne({
        where: {
          pubKey: req.body.signers[index]
        },
        include: [
          {
            model: dbInstance.models.Keys
          }
        ]
      });

      if (!pubKey) {
        _.pullAt(req.body.signers, index);
        continue;
      }

      req.body.signers[index] = pubKey.Key.address;

      _.has(req.body, `options.useKeys.${req.body.signers[index]}`) ?
        req.body.options.useKeys[req.body.signers[index]].push(pubKey.index) :
        _.set(req.body, `options.useKeys.${req.body.signers[index]}`, [pubKey.index]);
    }

    req.body.signers = _.uniq(req.body.signers);
  }


  let permissions = await req.client.getPermissions({
    include: [
      {
        model: dbInstance.models.Keys,
        required: true,
        where: req.body.signers ? {
          address: {
            $in: req.body.signers
          }
        } : {
          default: true
        }
      }
    ]
  });


  let keys = permissions.map(permission => permission.Key.toJSON());

  if (!_.compact(keys).length)
    return res.send(signMessages.wrongKey);

  const plugin = new plugins.plugins[req.params.blockchain](config.network);

  if (req.body.signers)
    keys = _.chain(req.body.signers)
      .map(signer => _.find(keys, {address: signer}))
      .compact()
      .value();


  let sharedKeyPermissions = _.filter(permissions, permission => !permission.owner);


  if (_.has(req.body, 'options.useKeys'))
    for (let address of Object.keys(req.body.options.useKeys)) {

      let key = _.find(keys, {address: address});

      let keyPermissions = _.filter(permissions, {KeyId: key.id});

      if (!keyPermissions.length) {
        delete req.body.options.useKeys[address];
        continue;
      }

      if (_.find(keyPermissions, {owner: true}))
        continue;

      for (let index of req.body.options.useKeys[address])
        if (!_.find(keyPermissions, {deriveIndex: index}))
          _.pull(req.body.options.useKeys[address], index);


    } else if (sharedKeyPermissions.length)
    _.chain(sharedKeyPermissions).groupBy('KeyId')
      .toPairs().forEach(pair => {
        if (!_.has(req.body, 'options.useKeys'))
          _.set(req.body, 'options.useKeys', {});

        let address = _.find(keys, {id: parseInt(pair[0])}).address;
        req.body.options.useKeys[address] = pair[1].map(item => item.index);
      })
      .value();


  if (_.find(keys, {isVirtual: true})) {

    let virtualKeys = _.filter(keys, {isVirtual: true});

    for (let virtualKey of virtualKeys) {

      let virtuals = await dbInstance.models.VirtualKeyPubKeys.findAll({
        where: {
          KeyId: virtualKey.id
        },
        include: [
          {
            model: dbInstance.models.PubKeys,
            include: [
              {
                model: dbInstance.models.Keys
              }
            ]
          }
        ]
      });


      for (let virtual of virtuals) {

        if (!_.get(req.body.options, 'useKeys'))
          _.set(req.body, 'options.useKeys', {});

        (req.body.options.useKeys[virtual.PubKey.Key.address] || (req.body.options.useKeys[virtual.PubKey.Key.address] = [])).push(virtual.PubKey.index);
        let foundKey = _.find(keys, {address: virtual.PubKey.Key.address});
        if (!foundKey)
          keys.push(virtual.PubKey.Key);
      }

      _.pull(keys, virtualKey);

    }
  }

  let tx = await plugin.sign(keys, req.body.payload, req.body.options);

  return res.send({rawTx: tx});
};
