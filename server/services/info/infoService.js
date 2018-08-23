const packageJson = require('../../../package');


module.exports = (req, res) => {
  return res.send({
    version: packageJson.version,
    uptime: `${process.uptime()}s`
  });
};
