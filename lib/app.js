'use strict';
// allow access to container filesystem via host
require('./loadenv.js')();
var url = require('url');
var express = require('express');
var app = express();
var path = require('path');
var restfs = require('rest-fs');
var bodyParser = require('body-parser');

// ensure container is passed correctly
var containerValidator = function(req, res, next) {
  if(!(req.body.container && req.body.container.root)) {
    return res.send(403).end();
  }
  return next();
};

var fileMapper = function(req, res, next) {
  // save trailing slash here to add
  var oldSlash = "";
  var newSlash = "";

  // map main url
  var dirPath =  decodeURI(url.parse(req.url).pathname);
  if(dirPath.substr(-1) === '/') {
    oldSlash = '/';
  }

  dirPath = path.normalize(dirPath);
  dirPath = path.resolve(dirPath);
  dirPath = path.join(process.env.FS_ROOT,
    req.body.container.root,
    process.env.FS_POSTFIX,
    dirPath);

  req.modifyOut = function  (filepath) {
    var rootPath = path.join(process.env.FS_ROOT,
      req.body.container.root,
      process.env.FS_POSTFIX);
    return {
      "name": path.basename(filepath),
      "path": path.normalize(path.dirname(filepath).replace(rootPath,"/")),
      "isDir" : filepath.substr(-1) === '/'
    };
  };
  req.url = dirPath + oldSlash;
  // map new path if there is one
  if(req.body.newPath) {
    if(req.body.newPath.substr(-1) === '/') {
      newSlash = '/';
    }
    req.body.newPath = path.normalize(req.body.newPath);
    req.body.newPath = path.resolve(req.body.newPath);
    req.body.newPath = path.join(process.env.FS_ROOT,
      req.body.container.root,
      req.body.newPath);
    req.body.newPath = req.body.newPath + newSlash;
  }
  return next();
};

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(containerValidator);
app.use(fileMapper);
restfs(app);

module.exports = app;