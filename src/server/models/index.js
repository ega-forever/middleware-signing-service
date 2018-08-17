const models = require('require-all')({
    dirname: __dirname,
    filter: /(.+Model)\.js$/
  });


module.exports = async (sequilize) => {

  for (let modelName of Object.keys(models))
    models[modelName](sequilize);

  await sequilize.sync();

};