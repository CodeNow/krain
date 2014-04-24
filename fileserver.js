// fileserver
// takes a dir and servers all files after

/* jshint maxdepth: 3 */
// maxdepth 3 only until offending functions are refactored
var express = require('express');
var app = express();
// var async = require('async');
// var mw = require('../middleware');
// var fs = require('../shims/fs');
// var zlib = require('zlib');
// var fstream = require('fstream');
// var tar = require('tar');
var path = require('path');
// var rimraf = require('rimraf');
// var createDomain = require('domain').create;
// var concat = require('concat-stream');
// var formidable = require('formidable');

var configs = {};
configs.containerRoot = "/Users/anand/run/other/krain/test";

var fsType = require('./fsDriver.js');


mw = {};
// set path to container root system
mw.setContainerRoot = function (req, res, next) {
  req.query.containerDir = path.join(configs.containerRoot, req.query.containerId);
  next();
};

// all file request must have container id.
app.use(function hasContainerId(req, res, next) {
  console.log("has container: "+req.query.containerId);
  err = null;
  if (!req.query.containerId) {
    err = new Error("no contaienr id specified");
    next(err);
    return;
  }
  next(err);
});

app.use(mw.setContainerRoot);

/* GET
  /listall : list files and folder recursively under given path
  ?containerId = long version of container id used to find root file system
  ?path = path to list files and directorys of
  
  return: json array of files and dir structured like so:
  [
    {
      "name" : "file1", // name of dir or file
      "path" : "/path/to/file", // path to dir or file 
      "dir" : false // true if directory
    },
  ]
*/
app.get('/listall',
 function (req, res, next) {
  fsType.listAll(path.join(req.query.containerDir, req.query.path),
    req.query.directoriesOnly, 
    function (err, files) {
      if (err) {
        next(err);
        return;
      }
      res.json(files);
    });
});

/* GET
  /list : list files and folders under given path only (no recursion)
  ?containerId = long version of container id used to find root file system
  ?path = path to list files and directorys of
  
  return: json array of files and dir structured like so:
  [
    {
      "name" : "file1", // name of dir or file
      "path" : "/path/to/file", // path to dir or file 
      "dir" : false // true if directory
    },
  ]
*/
app.get('/list',
 function (req, res, next) {
  fsType.list(path.join(req.query.containerDir, req.query.path),
    function (err, files) {
      if (err) {
        next(err);
        return;
      }
      res.json(files);
    });
});

/* GET
  /read : reads file pointed to by path
  ?containerId = long version of container id used to find root file system
  ?path = path to file

  return: content of specified file as Content-Type "text/html":
  "example file"
  "line 2 of example file"
*/
app.get('/read', function (req, res, next) {
  fsType.readFile(path.join(req.query.containerDir, req.query.path), 
    function(err, content) {
      if (err) {
        next(err);
        return;
      }
      res.send(200, content);
    });
});

/* POST
  /mkdir : mkdir passed into path
  ?containerId = long version of container id used to find root file system
  ?path = path of dir to make
  *optional*
  ?mode = permissons of file (511 default 0777 octal)

  return: null
*/
app.post('/mkdir', function (req, res, next)  {
  var mode = req.query.mode || 511;
  fsType.mkdir(path.join(req.query.containerDir, req.query.path),
    mode,
    function(err) {
      if (err) {
        next(err);
        return;
      }
      res.send(200);
    });
});

/* POST
  /rename : rename file or folder
  ?containerId = long version of container id used to find root file system
  ?oldpath = path of file or folder to rename
  ?newpath = path of renamed file or folder

  return: null
*/
app.post('/rename', function (req, res, next)  {
  fsType.rename(path.join(req.query.containerDir, req.query.oldpath),
    path.join(req.query.containerDir, req.query.newpath),
    function(err) {
      if (err) {
        next(err);
        return;
      }
      res.send(200);
    });
});

/* POST
  /remove : remove a folder
  ?containerId = long version of container id used to find root file system
  ?path = path of dir to remove

  return: null
*/
app.post('/remove', function (req, res, next)  {
  console.log("req.query.path: " + req.query.path);
  console.log("req.query.containerDir: " + req.query.containerDir);
  fsType.remove(path.join(req.query.containerDir, req.query.path),
    function(err) {
      if (err) {
        next(err);
        return;
      }
      res.send(200);
    });
});

/* POST
  /remove : remove a folder
  ?containerId = long version of container id used to find root file system
  ?path = path of file to create
  body.content = data of file
  *optional*
  ?encoding = default utf8
  ?mode = permissons of file default 438 (aka 0666 in Octal)

  return: null
*/
app.post('/write', function (req, res, next)  {
  console.log("req.query.path: " + req.query.path);
  console.log("req.query.containerDir: " + req.query.containerDir);
  var options = {
    encoding: req.query.encoding || 'utf8',
    mode: req.query.mode || 438
  };
  if (!req.body.content) {
    next(new Error("no data for file"));
  }
  fsType.write(path.join(req.query.containerDir, req.query.path),
    req.body.content,
    options,
    function(err) {
      if (err) {
        next(err);
        return;
      }
      res.send(200);
    });
});


app.use(function (err, req, res, next)  {
  console.error(err);
  res.send(500, err);
});
app.listen(3000);
