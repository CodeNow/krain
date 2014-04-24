// fileserver
// takes a dir and servers all files after
var express = require('express');
var app = express();
var configs = {};
configs.containerRoot = "/Users/anand/run/other/krain/test";

var fsType = require('./fsDriver.js');
var url = require('url');

/* GET
  /path/to/dir/
  list contents of directory
  
  return:
  [
    {
      "name" : "file1", // name of dir or file
      "path" : "/path/to/file", // path to dir or file 
      "dir" : false // true if directory
    },
  ]
*/
app.get("/*/", 
  function (req, res, next) { 
    // console.dir(req);
    var dirPath =  decodeURI(url.parse(req.url).pathname);
    console.log("dir dirPath: "+dirPath);
    fsType.list(dirPath,
      function (err, files) {
        if (err) {
          next(err);
          return;
        }
        res.json(files);
    });
});

/* GET
  /path/to/file
  return contents of file
  if dir, redirect to dir path

  ?encoding = default utf8

  return:
  content of specified file as Content-Type "text/html"
*/
app.get("/*", 
  function (req, res, next) { 
    // console.dir(req);
    var filePath = decodeURI(url.parse(req.url).pathname);
    var encoding = req.query.encoding || 'utf8';
    console.log("encoding: "+ encoding+" filePath: "+filePath);

    fsType.readFile(filePath, encoding, function(err, data) {
      if (err) {
        // this this is a dir, redirect to dir path
        if (err.code === 'EISDIR') {
          var originalUrl = url.parse(req.originalUrl);
          originalUrl.pathname += '/';
          var target = url.format(originalUrl);
          res.statusCode = 303;
          res.setHeader('Location', target);
          res.end('Redirecting to ' + target);
          return;
        }
        next(err);
        return;
      }
      res.send(200, data);
    });
});

app.use(function (err, req, res, next)  {
  console.error(err);
  res.send(500, err);
});
app.listen(3000);
