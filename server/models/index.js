const models = require('require-all')({
    dirname: __dirname,
    filter: /(.+Model)\.js$/
  });


module.exports = async (sequilize) => {

  for (let modelName of Object.keys(models))
    models[modelName](sequilize);

  sequilize.models.Clients.hasMany(sequilize.models.Permissions, {onDelete: 'CASCADE'});
  sequilize.models.Keys.hasMany(sequilize.models.Permissions, {onDelete: 'CASCADE'});
  sequilize.models.Permissions.belongsTo(sequilize.models.Clients);
  sequilize.models.Permissions.belongsTo(sequilize.models.Keys);

  await sequilize.sync();

};
