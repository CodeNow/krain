// fsDriver
// use fs engine to server files
var fs = require('fs');
var findit = require('findit');
var path = require('path');

var listAll = function(reqDir, onlyDir, cb) {
/* returns array of files and dir in format :
[
  {
    name: base,
    path: path.dirname(file),
    dir: false
  },
  ...
]
*/
  console.log("finding in "+reqDir);
  var finder = findit(reqDir);
  var files = [];

  finder.on('directory', function (dir, stat, stop) {
    console.log("basename:"+path.basename(dir));
    files.push({
      name: path.basename(dir),
      path: path.dirname(dir),
      dir: true
    });
  });

  if (!onlyDir) {
    finder.on('file', function (file, stat) {
      files.push({
        name: path.basename(file),
        path: path.dirname(file),
        dir: false
      });
    });
  }

  finder.on('end', function () {
    cb(null, files);
  });
};

var list = function(reqDir, cb) {
/* returns array of files and dir in format :
[
  {
    name: base, // file or dir name
    path: path.dirname(file), // path to file
    dir: false
  },
  ...
]
*/
  console.log("finding in "+reqDir);
  var filesList = [];
  var cnt = 0;

  fs.readdir(reqDir, function (err, files) {
    if (!files) {
      cb(null, []);
      return;
    }
    var formatFileList = function(index) {
      return function (err, stat) {
        filesList.push({
          name: files[index],
          path: reqDir,
          isDir: stat.isDirectory()
        });
        cnt++;
        if (cnt === files.length) {
          cb(null, filesList);
        }
      };
    };
    for (var i = 0; i < files.length; i++) {
      fs.stat(path.join(reqDir, files[i]), formatFileList(i));
    }
  });
};

/*
  read file from filepath
*/
var readFile = function(filePath, cb) { 
  fs.readFile(filePath, 'utf8', function (err, content) {
    cb(null, content);
  });
};

/*
  mkdir
*/
var mkdir = function(dirPath, cb)  {
  fs.mkdir(dirPath, function(err) {
    cb(err);
  });
};


/*
  rename
*/
var rename = function(oldPath, newPath, cb)  {
  fs.rename(oldPath, newPath, function(err) {
    cb(err);
  });
};

/*
  remove
*/
var remove = function(dirPath, cb)  {
  fs.rmdir(dirPath, function(err) {
    cb(err);
  });
};

module.exports.listAll = listAll;
module.exports.list = list;
module.exports.readFile = readFile;
module.exports.mkdir = mkdir;
module.exports.rename = rename;
module.exports.remove = remove;
