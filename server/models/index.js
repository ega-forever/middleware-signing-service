/**
 * Copyright 2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Egor Zuev <zyev.egor@gmail.com>
 */

const models = require('require-all')({
  dirname: __dirname,
  filter: /(.+Model)\.js$/
});

/**
 * @factory
 * @description model factory
 * @param sequelize - the sequelize instance
 * @return {*}
 */
module.exports = async (sequelize) => {

  for (let modelName of Object.keys(models))
    models[modelName](sequelize);

  sequelize.models.Clients.hasMany(sequelize.models.Permissions, {foreignKey: {allowNull: false}, onDelete: 'CASCADE'});
  sequelize.models.Clients.hasMany(sequelize.models.Keys, {foreignKey: {allowNull: false}, onDelete: 'CASCADE'});


  sequelize.models.Keys.hasMany(sequelize.models.Permissions, {foreignKey: {allowNull: false}, onDelete: 'CASCADE'});
  sequelize.models.Keys.hasMany(sequelize.models.PubKeys, {foreignKey: {allowNull: false}, onDelete: 'CASCADE'});
  sequelize.models.Permissions.belongsTo(sequelize.models.Clients, {foreignKey: {allowNull: false}});
  sequelize.models.Permissions.belongsTo(sequelize.models.Keys, {foreignKey: {allowNull: false}});
  sequelize.models.PubKeys.belongsTo(sequelize.models.Keys, {foreignKey: {allowNull: false}});


  sequelize.models.VirtualKeyPubKeys.belongsTo(sequelize.models.PubKeys, {
    foreignKey: {allowNull: false},
    onDelete: 'CASCADE'
  });
  sequelize.models.VirtualKeyPubKeys.belongsTo(sequelize.models.Keys, {
    foreignKey: {allowNull: false},
    onDelete: 'CASCADE'
  });

  sequelize.models.Keys.hasMany(sequelize.models.VirtualKeyPubKeys, {foreignKey: {allowNull: false}, onDelete: 'CASCADE'});


  await sequelize.sync();

};
