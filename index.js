// allow access to container filesystem via host
var config = require("./configs.js");
var url = require('url');
var express = require('express');
var app = express();
var path = require('path');
var restfs = require('rest-fs');
var port = config.port;
var bodyParser = require('body-parser');

// ensure container is passed correctly
var containerValidator = function(req, res, next) {
  if(!(req.body.container && req.body.container.root)) {
    return res.send(403);
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
  dirPath = path.join(config.fsRoot, req.body.container.root, config.fsPostFix,dirPath);

  app.setModifyOut(function  (filepath) {
    return {
      "name": path.basename(filepath),
      "path": path.normalize(path.dirname(filepath).replace(path.dirname(dirPath),"/")),
      "isDir" : filepath.substr(-1) === '/'
    };
  });
  req.url = dirPath + oldSlash;
  // map new path if there is one
  if(req.body.newPath) {
    if(req.body.newPath.substr(-1) === '/') {
      newSlash = '/';
    }
    req.body.newPath = path.normalize(req.body.newPath);
    req.body.newPath = path.resolve(req.body.newPath);
    req.body.newPath = path.join(config.fsRoot, req.body.container.root, req.body.newPath);
    req.body.newPath = req.body.newPath + newSlash;
  }
  return next();
};

app.use(bodyParser());
app.use(containerValidator);
app.use(fileMapper);
restfs(app);
app.listen(port);

module.exports = app;