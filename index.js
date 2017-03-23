'use strict';
require('loadenv')();
var app = require('./lib/app.js');

app.listen(process.env.PORT);

module.exports = app;
