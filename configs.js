var eson = require('eson');
var path = require('path');
var env = process.env.NODE_ENV;

function readConfigs (filename) {
  return eson()
    .use(eson.replace('{ROOT_DIR}', path.normalize(__dirname)))
    .read(path.join(__dirname, '/configs/', filename+'.json'));
}
module.exports = readConfigs(env);
module.exports.readConfigs = readConfigs;