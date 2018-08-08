const keystone = require('keystone'),
  plugins = require('./plugins');

keystone.init({
  'cookie secret': 'secure string goes here',
});


keystone.init({
  'cookie secret': 'secure string goes here',
  'name': 'my-project',
  'user model': 'User',
  'auto update': true,
  'auth': true,
  mongo: 'mongodb://localhost:32777/singing-service'
});

keystone.import('models');

keystone.start();