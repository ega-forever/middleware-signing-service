
module.exports.id = '2d5837e4.26b6d8';

const _ = require('lodash'),
  config = require('../config');

/**
 * @description flow 2d5837e4.26b6d8 update
 * @param done
 */
   

module.exports.up = function (done) {
  let coll = this.db.collection(`${_.get(config, 'nodered.mongo.collectionPrefix', '')}noderedstorages`);
  coll.update({"path":"2d5837e4.26b6d8","type":"flows"}, {
    $set: {"path":"2d5837e4.26b6d8","body":[{"id":"b81733d4.f5163","type":"http in","z":"2d5837e4.26b6d8","name":"sign tx","url":"/sign/:blockchain/:address","method":"post","upload":false,"swaggerDoc":"","x":160,"y":280,"wires":[["984b13a7.aa10a"]]},{"id":"984b13a7.aa10a","type":"async-function","z":"2d5837e4.26b6d8","name":"","func":"const sign = global.get('libs.signingService');\n\nmsg.payload.tx = sign(\n    msg.req.params.blockchain, \n    msg.req.params.address, \n    msg.payload.tx\n);\nreturn msg;","outputs":1,"noerr":0,"x":330,"y":260,"wires":[["58f01c3.6c780e4"]]},{"id":"58f01c3.6c780e4","type":"http response","z":"2d5837e4.26b6d8","name":"","statusCode":"","headers":{},"x":520,"y":300,"wires":[]},{"id":"42ec7ca.433fb84","type":"catch","z":"2d5837e4.26b6d8","name":"","scope":null,"x":180,"y":140,"wires":[["581a63dd.2e678c","27aeeb04.a29f04"]]},{"id":"581a63dd.2e678c","type":"function","z":"2d5837e4.26b6d8","name":"","func":"let factories = global.get(\"factories\"); \n\nmsg.payload = factories.messages.generic.fail;\nmsg.payload.message = JSON.stringify(msg.error.message);\nreturn msg;","outputs":1,"noerr":0,"x":330,"y":140,"wires":[["6c9bb845.287378"]]},{"id":"6c9bb845.287378","type":"http response","z":"2d5837e4.26b6d8","name":"","statusCode":"","headers":{},"x":480,"y":140,"wires":[]},{"id":"27aeeb04.a29f04","type":"debug","z":"2d5837e4.26b6d8","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"true","x":240,"y":80,"wires":[]}]}
  }, {upsert: true}, done);
};

module.exports.down = function (done) {
  let coll = this.db.collection(`${_.get(config, 'nodered.mongo.collectionPrefix', '')}noderedstorages`);
  coll.remove({"path":"2d5837e4.26b6d8","type":"flows"}, done);
};
