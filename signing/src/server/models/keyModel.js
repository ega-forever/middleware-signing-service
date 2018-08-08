const Sequelize = require('sequelize');

module.exports = (sequelize) => {

  return sequelize.define('Keys', {
    address: {
      type: Sequelize.STRING,
      primaryKey: true
    },
    privateKey: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
    },
    masterKeyAddress: {
      type: Sequelize.STRING,
      allowNull: true
    }
  }, {
    indexes: [{fields: ['masterKeyAddress']}]
  });

};
