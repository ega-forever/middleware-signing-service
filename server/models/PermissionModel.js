const Sequelize = require('sequelize');

module.exports = (sequelize) => {

  return sequelize.define('Permissions', {
    deriveIndex: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    owner: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  });

};
