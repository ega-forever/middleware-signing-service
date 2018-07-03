
module.exports.id = 'tabs';

const _ = require('lodash'),
  config = require('../config');

/**
 * @description flow tabs update
 * @param done
 */
   

module.exports.up = function (done) {
  let coll = this.db.collection(`${_.get(config, 'nodered.mongo.collectionPrefix', '')}noderedstorages`);
  coll.update({"path":"tabs","type":"flows"}, {
    $set: {"path":"tabs","body":[{"id":"2d5837e4.26b6d8","type":"tab","label":"Flow 1","disabled":false,"info":""}]}
  }, {upsert: true}, done);
};

module.exports.down = function (done) {
  let coll = this.db.collection(`${_.get(config, 'nodered.mongo.collectionPrefix', '')}noderedstorages`);
  coll.remove({"path":"tabs","type":"flows"}, done);
};
