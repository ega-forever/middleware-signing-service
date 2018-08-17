const express = require('express'),
  routes = require('./routes'),
  models = require('./models'),
  dbController = require('./controllers/dbController'),
  bodyParser = require('body-parser'),
  app = express();

const init = async () => {

  app.use(bodyParser.urlencoded({extended: false}));
  app.use(bodyParser.json());

  app.use(express.static('dist'));

  let dbInstance = dbController.get();
  await dbInstance.sync();
  await models(dbInstance);
  routes(app);

  app.listen(8080, () => console.log('Listening on port 8080!'));


};

module.exports = init().catch(e => console.log(e));