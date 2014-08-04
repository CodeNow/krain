'use strict';
var dotenv = require('dotenv');
var eson = require('eson');
var path = require('path');
var env = process.env.NODE_ENV;
module.exports = readDotEnvConfigs;
var read = false;

function readDotEnvConfigs () {
  if (read === true) {
    return;
  }
  read = true;
  dotenv._getKeysAndValuesFromEnvFilePath(path.resolve(__dirname, '../configs/.env'));
  dotenv._getKeysAndValuesFromEnvFilePath(path.resolve(__dirname, '../configs/.env.'+ env));
  dotenv._setEnvs();
  dotenv.load();

  process.env = eson()
    .use(convertStringToNumeral)
    .use(eson.replace('{ROOT_DIR}', path.resolve(__dirname, '../')))
    .parse(JSON.stringify(process.env));

  console.log('ENV', process.env);
}
function convertStringToNumeral(key, val) {
  if (!isNaN(val)) {
    return parseInt(val);
  } else {
    return val;
  }
}