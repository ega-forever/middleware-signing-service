const Sequelize = require('sequelize');

module.exports = (sequelize) => {

  return sequelize.define('AccountKeys', {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    address: {
      type: Sequelize.STRING
    },
    keyAddress: {
      type: Sequelize.STRING
    }
  }, {
    indexes: [
      {fields: ['address']},
      {fields: ['keyAddress']}
    ]
  });


};
