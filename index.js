// Create terminal stream for a container using nsenter
config = {};

config.fsRoot = "/docker/execdriver/native";
if(process.env.NODE_ENV === "test") {
  config.fsRoot = __dirname+'/test';
}
var url = require('url');
var express = require('express');
var app = express();
var path = require('path');
var which = require('which');
var pty = require('pty.js');
var nsenter = "";
var restfs = require('rest-fs');
var port = 3000;
var bodyParser = require('body-parser');

// ensure container is passed correctly
var containerValidator = function(req, res, next) {
  if(!(req.body && req.body.container && req.body.container.root)) {
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
  dirPath = path.join(config.fsRoot, req.body.container.root, dirPath);
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
// var krain = function(Opts, Cb) {
//   var opts = Opts;
//   var cb = Cb;
//   if (typeof opts == 'function') {
//     cb = Opts;
//     opts = {};
//   }
//   which('nsenter', function(err, cmdpath) {
//     if (err) {
//       cb(new Error('nsenter not avalible. module useless'));
//       return;
//     }
//     nsenter = cmdpath;
//     cb();
//   });
// };

//   pid of container to connect to *REQUIRED
//   Args are argument for nsenter. defaults to all
//   Opts are option for pty default empty
//   returns stream to STDIN of container

// var connect = function(pid, Args, Opts) {
//   var args = Args || "--mount --uts --ipc --net --pid";
//   var term = pty.spawn('bash',
//     ["-c", "sudo "+nsenter+" --target " + pid + " " + args],
//     Opts
//    );
//   return term;
// };


// module.exports.krain = krain;
// module.exports.connect = connect;

