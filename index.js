'use strict';
require('./lib/loadenv.js')();
var app = require('./lib/app.js');

app.listen(process.env.PORT);

module.exports = app;