const Sequelize = require('sequelize');

module.exports = (sequelize) => {

  return sequelize.define('Clients', {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    clientId: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
    },
    clientName: {
      type: Sequelize.STRING
    }
  });


};
