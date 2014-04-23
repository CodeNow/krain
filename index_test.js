// test connect api
var krain = require('index.js');
var connect = krain.connect;
/*
  pid of container to connect to *REQUIRED
  Args are argument for nsenter. defaults to all
  Opts are option for pty default empty
  returns stream to STDIN of container
*/
var inst = connect('26073',"--mount --uts --ipc --net --pid",
  {
    cols: 80,
    rows: 30
  });
var inst = connect('26073',"--mount --uts --ipc --net --pid");

// try all permutations of inputs as well as invalid ones
