const Sequelize = require('sequelize');

module.exports = (sequelize) => {

  return sequelize.define('PubKeys', {
    pubKey: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: 'compositeIndex'
    },
    blockchain: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: 'compositeIndex'
    },
    index: {
      type: Sequelize.INTEGER,
      allowNull: false
    }
  });

};
