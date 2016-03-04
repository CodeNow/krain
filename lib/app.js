'use strict';
// allow access to container filesystem via host
require('./loadenv.js')();
var url = require('url');
var express = require('express');
var app = express();
var path = require('path');
var restfs = require('rest-fs');
var bodyParser = require('body-parser');
var keypather = require('keypather')();

// ensure container is passed correctly
var containerValidator = function(req, res, next) {
  if (!req.query.container) {
    return res.status(400).end();
  }
  if (!/^[a-zA-Z0-9]+$/.test(req.query.container)) {
    // Test to make sure the containerId
    return res.status(400).end();
  }
  return next();
};

function isPathInvalid (path) {
  // Check for ../ at the beginning, or /../ anywhere in the path
  return /(^\/?\.\.\/|\/\.\.\/)/.test(path)
}

// ensure the path isn't being attacked
var pathValidator = function(req, res, next) {
  var dirPath = decodeURI(url.parse(req.url).pathname);
  // if any relative traversals are in the path, mark it forbidden
  if (isPathInvalid(dirPath)) {
    return res.status(403).send('no relative upward traversals');
  }

  if (keypather.get(req, 'body.newPath')) {
    var newPath = req.body.newPath;
    if (isPathInvalid(newPath)) {
      return res.status(403).send('no relative upward traversals');
    }
  }
  return next();
};

var fileMapper = function(req, res, next) {
  // save trailing slash here to add
  var oldSlash = "";
  var newSlash = "";
  var containerRoot = req.query.container;

  var isJson = false;
  if (typeof req.headers['content-type'] === 'string') {
    isJson = ~req.headers['content-type'].indexOf('application/json') === -1 ? true : false;
  }

  // map main url
  var dirPath =  decodeURI(url.parse(req.url).pathname);
  if(dirPath.substr(-1) === '/') {
    oldSlash = '/';
  }

  dirPath = path.normalize(dirPath);
  dirPath = path.resolve(dirPath);
  dirPath = path.join(process.env.FS_ROOT,
    containerRoot,
    process.env.FS_POSTFIX,
    dirPath);

  req.modifyOut = function  (filepath) {
    var rootPath = path.join(process.env.FS_ROOT,
      containerRoot,
      process.env.FS_POSTFIX);

    if(rootPath.substr(-1) === '/') {
      rootPath = rootPath.substr(0, rootPath.length - 1);
    }

    return {
      "name": path.basename(filepath),
      "path": path.normalize(path.dirname(filepath).replace(rootPath,"/")),
      "isDir" : filepath.substr(-1) === '/'
    };
  };
  req.url = dirPath + oldSlash;
  req.url = path.normalize(req.url);
  // map new path if there is one
  if(isJson && req.body.newPath) {
    if(req.body.newPath.substr(-1) === '/') {
      newSlash = '/';
    }
    req.body.newPath = path.normalize(req.body.newPath);
    req.body.newPath = path.resolve(req.body.newPath);
    req.body.newPath = path.join(process.env.FS_ROOT,
      containerRoot,
      process.env.FS_POSTFIX,
      req.body.newPath);
    req.body.newPath = req.body.newPath + newSlash;
  }
  return next();
};

app.use(containerValidator);
app.use(bodyParser.json({
  limit: process.env.UPLOAD_PARSER_LIMIT
}));
app.use(pathValidator);
app.use(fileMapper);
restfs(app);

module.exports = app;
module.exports.isPathInvalid = isPathInvalid;
