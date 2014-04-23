// Create terminal stream for a container using nsenter
config.fsRoot = "/docker/execdriver/native";

var which = require('which');
var pty = require('pty.js');
var nsenter = "";


var krain = function(Opts, Cb) {
  var opts = Opts;
  var cb = Cb;
  if (typeof opts == 'function') {
    cb = Opts;
    opts = {};
  }
  which('nsenter', function(err, cmdpath) {
    if (err) {
      cb(new Error('nsenter not avalible. module useless'));
      return;
    }
    nsenter = cmdpath;
    cb();
  });
};
/*
  pid of container to connect to *REQUIRED
  Args are argument for nsenter. defaults to all
  Opts are option for pty default empty
  returns stream to STDIN of container
*/
var connect = function(pid, Args, Opts) {
  var args = Args || "--mount --uts --ipc --net --pid";
  var term = pty.spawn('bash',
    ["-c", "sudo "+nsenter+" --target " + pid + " " + args],
    Opts
   );
  return term;
};


/*
  get container filesystem obj
*/
var getFs = function(containerId, cb) {
  // validate container id
  return {
    containerRoot: config.fsRoot + containerId
  };
};


module.exports.krain = krain;
module.exports.connect = connect;

