const models = require('require-all')({
  dirname: __dirname,
  filter: /(.+Model)\.js$/
});


module.exports = async (sequilize) => {

  for (let modelName of Object.keys(models))
    models[modelName](sequilize);

  sequilize.models.Clients.hasMany(sequilize.models.Permissions, {foreignKey: {allowNull: false}, onDelete: 'CASCADE'});
  sequilize.models.Keys.hasMany(sequilize.models.Permissions, {foreignKey: {allowNull: false}, onDelete: 'CASCADE'});
  sequilize.models.Keys.hasMany(sequilize.models.PubKeys, {foreignKey: {allowNull: false}, onDelete: 'CASCADE'});
  sequilize.models.Permissions.belongsTo(sequilize.models.Clients, {foreignKey: { allowNull: false }});
  sequilize.models.Permissions.belongsTo(sequilize.models.Keys, {foreignKey: { allowNull: false }});
  sequilize.models.PubKeys.belongsTo(sequilize.models.Keys, {foreignKey: { allowNull: false }});

  await sequilize.sync();

};
