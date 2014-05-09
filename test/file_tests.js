var Lab = require('lab');
var fs = require('fs');
var server = require('../index.js');
var supertest = require('supertest');
var containerFullPath = __dirname+"/container1";
var containerId = "container1";

var async = require('async');
var rimraf = require('rimraf');
Lab.before(function (done) {
  cleanBase(done);
});
Lab.after(function (done) {
  rimraf(containerFullPath, done);
});

function cleanBase(cb) {
  rimraf(containerFullPath, function(err) {
    fs.mkdir(containerFullPath, cb);
  });
}

function createFile(filepath, opts, cb) {
  if(typeof opts === 'function') {
    cb = opts;
    opts = {};
  }
  opts.container = {
      root: containerId
  };
  var req = supertest(server).put(filepath);
  if (opts) {
    req.send(opts);
  } 
  req.end(function(err, res){
    if (err) {
      return cb(err);
    }
    fs.stat(containerFullPath+filepath, function (err, stats) {
      if (err) {
        return cb(err);
      } else if (stats.isFile()) {
        return cb();
      } else {
        return cb(new Error('file did not get created'));
      }
    });
  });
}

function createFilePost(filepath, opts, cb) {
  if(typeof opts === 'function') {
    cb = opts;
    opts = {};
  }
  opts.container = {
      root: containerId
  };
  var req = supertest(server).post(filepath);
  if (opts) {
    req.send(opts);
  } 
  req.end(function(err, res){
    if (err) {
      return cb(err);
    }
    fs.stat(containerFullPath+filepath, function (err, stats) {
      if (err) {
        return cb(err);
      } else if (stats.isFile()) {
        return cb();
      } else {
        return cb(new Error('file did not get created'));
      }
    });
  });
}

function moveFile(oldpath, newPath, doClobber, doMkdirp, cb) {
  supertest(server)
    .post(oldpath)
    .send({
      newPath: newPath,
      clobber: doClobber,
      mkdirp: doMkdirp,
      container : {root: containerId}
    })
    .end(function(err, res){
      if (err) {
        return cb(err);
      } else if (200 !== res.statusCode) {
        if(res.body) {
          return cb(res.body);
        }  
        return cb(res.statusCode);  
      }
      async.series([
        function(next) {
          // old path should not exist
          fs.stat(containerFullPath+oldpath, function (err, stats) {
            if (err) {
              if (err.code === 'ENOENT') {
                return next();
              }
              return next(err);
            } else {
              return next(new Error('old file did not move'));
            }
          });
        },
        function(next) {
          // new path should exist
          fs.stat(containerFullPath+newPath, function (err, stats) {
            if (err) {
              return next(err);
            } else if (stats.isFile()) {
              return next();
            } else {
              return next(new Error('file did not get moved correctly'));
            }
          });
        }
      ], cb);
    });
}

function createDir(dirPath, cb) {
  fs.mkdir(dirPath, cb);
}

Lab.experiment('basic create tests', function () {
  Lab.beforeEach(function (done) {
    cleanBase(done);
  });

  Lab.test('create empty file PUT', function (done) {
    var filepath = '/test_file.txt';
    createFile(filepath, done);
  });

  Lab.test('create empty file POST', function (done) {
    var filepath = '/test_file.txt';
    createFilePost(filepath, done);
  });

  Lab.test('create empty file POST w/ encoding', function (done) {
    var filepath = '/test_file.txt';
    createFilePost(filepath, {encoding: "utf8"}, done);
  });

  Lab.test('create empty file POST w/ mode', function (done) {
    var filepath = '/test_file.txt';
    createFilePost(filepath, {mode: 777}, done);
  });

  Lab.test('create empty file POST w/ content', function (done) {
    var filepath = '/test_file.txt';
    createFilePost(filepath, {content: "testText"}, done);
  });

  Lab.test('create empty file PUT w/ encoding', function (done) {
    var filepath = '/test_file.txt';
    createFile(filepath, {encoding: "utf8"}, done);
  });

  Lab.test('create empty file PUT w/ mode', function (done) {
    var filepath = '/test_file.txt';
    createFile(filepath, {mode: 777}, done);
  });

  Lab.test('create file with spaces in filename PUT', function (done) {
    var filepath = '/test file.txt';
    createFile(filepath, done);
  });

  Lab.test('create file with text PUT', function (done) {
    var filepath = '/test_file.txt';
    var testText = "test";
    createFile(filepath, {content: testText}, function(err) {
      fs.readFile(containerFullPath+filepath, {
        encoding: 'utf8'
      }, function (err, data) {
        if (err) {
          return done(err);
        } else if (!~data.indexOf(testText)) {
          return done(new Error('incorrect data'));
        } else {
          return done();
        }
      });
    });
  });

  Lab.test('create file with text and spaces in file name PUT', function (done) {
    var filepath = '/test file.txt';
    var testText = "test";
    createFile(filepath, {content: testText}, function(err) {
      fs.readFile(containerFullPath+filepath, {
        encoding: 'utf8'
      }, function (err, data) {
        if (err) {
          return done(err);
        } else if (!~data.indexOf(testText)) {
          return done(new Error('incorrect data'));
        } else {
          return done();
        }
      });
    });
  });

  Lab.test('create file in path that does not exist PUT', function (done) {
    var filepath = '/fake/test_file.txt';
    createFile(filepath,
      function (err, data) {
        if (err) {
          if (err.code === 'ENOENT') {
            return done();
          }
          return done(new Error('file should not have been created'));
        }
      });
  });

  Lab.test('overwrite file PUT', function (done) {
    var filepath = '/test_file.txt';
    var testText = "test";
    var testText2 = "wonder";
    createFile(filepath, {content: testText}, function(err) {
      createFile(filepath, {content: testText2}, function(err) {
        fs.readFile(containerFullPath+filepath, {
          encoding: 'utf8'
        }, function (err, data) {
          if (err) {
            return done(err);
          } else if (!~data.indexOf(testText2)) {
            return done(new Error('incorrect data'));
          } else {
            return done();
          }
        });
      });
    });
  });

});

function rmFile(path, cb) {
  supertest(server)
        .del(path)
        .send({container: {root: containerId}})
        .end(function(err, res){
          if (err) {
            return cb(err);
          } else if (200 !== res.statusCode) {
            if(res.body) {
              return cb(res.body);
            }  
            return cb(res.statusCode);  
          }
          fs.stat(path, function (err, stats) {
            if (err) {
              if (err.code === 'ENOENT') {
                return cb();
              }
              return cb(err);
            } else {
              return cb(new Error('file did not get deleted'));
            }
          });
      });
}
Lab.experiment('basic delete tests', function () {
  Lab.beforeEach(function (done) {
    cleanBase(done);
  });

  Lab.test('delete file', function (done) {
    var filepath = '/test_file.txt';
    createFile(filepath, function(err) {
      if (err) {
        return done(err);
      }
      rmFile(filepath, done);
    });
  });

  Lab.test('delete file that does not exist', function (done) {
    rmFile('/fake.txt', function(err){
      if(err) {
        if(err.code === 'ENOENT') {
          return done();
        }
        return done(err);
      }
      return done(new Error('file should not exist'));
    });
  });

  Lab.test('try to delete folder', function (done) {
    createDir(containerFullPath+'/delete_me', function (err) {
      rmFile('/delete_me', function(err) {
        if(err) {
          if(err.code === 'EPERM' || err.code === 'EISDIR') {
            return done();
          }
          return done(err);
        }
        return done(new Error('folder should not be removed'));
      });
    });
  });
});

var readFile= function (filepath, query, cb) {
  if(typeof query === 'function') {
    cb = query;
    query = null;
  }
  var req = supertest(server).get(filepath);
  if (query) {
    req.query(query);
  }
  req
    .send({container: {root: containerId}})
    .end(cb);
};

Lab.experiment('read tests', function () {
  var file1path = '/test_file1.txt';
  var file2path = '/test_file2.txt';
  var fileContent = "test";

  Lab.before(function (done) {
    async.series([
      function(cb) {
        cleanBase(cb);
      },
      function(cb) {
        createFile(file1path, cb);
      },
      function(cb) {
        createFile(file2path, {content: fileContent}, cb);
      }
    ], done);
  });
  
  Lab.after(function (done) {
    cleanBase(done);
  });

  Lab.test('read file', function (done) {
    readFile(file2path, function(err, res) {
      if (err) {
        return done(err);
      } else if (!~fileContent.indexOf(res.text)) {
        return done(new Error('file read wrong data'));
      }
      return done();
    });
  });

  Lab.test('read file utf8', function (done) {
    readFile(file2path, {encoding: 'utf8'}, function(err, res) {
        if (err) {
          return done(err);
        } else if (!~fileContent.indexOf(res.text)) {
          return done(new Error('file read wrong data'));
        }
        return done();
      });
  });

  Lab.test('read empty file', function (done) {
    readFile(file1path, {encoding: 'utf8'}, function(err, res) {
        if (err) {
          return done(err);
        } else if (res.text !== "") {
          return done(new Error('file should be empty'));
        }
        return done();
      });
  });

  Lab.test('read file with redirect', function (done) {
    readFile(file2path+'/', function(err, res) {
        if (err) {
          return done(err);
        } else if (!~res.text.indexOf('Redirecting to '+file2path)) {
          return done(new Error('not redirecting'));
        }
        return done();
      });
  });

  Lab.test('read empty file with redirect', function (done) {
    readFile(file1path+'/', function(err, res) {
        if (err) {
          return done(err);
        } else if (!~res.text.indexOf('Redirecting to '+file1path)) {
          return done(new Error('not redirecting'));
        }
        return done();
      });
  });

  Lab.test('read file that does not exist', function (done) {
    readFile(file1path+'.fake.txt', function(err, res) {
        if (err) {
          return done(err);
        } else if (res.body.code !== 'ENOENT') {
          return done(new Error('file should not exist'));
        }
        return done();
      });
  });
});

Lab.experiment('move tests', function () {
  var dir1path =  '/test_dir1/';
  var dir2path =  '/test_dir2/';
  var file1path = '/test_file1.txt';
  var file2path = '/test_file2.txt';
  var fileContent = "test";

  Lab.before(function (done) {
    async.series([
      function(cb) {
        createDir(containerFullPath+dir1path, cb);
      },
      function(cb) {
        createDir(containerFullPath+dir2path, cb);
      },
      function(cb) {
        createFile(file1path, cb);
      },
      function(cb) {
        createFile(file2path, {content: fileContent}, cb);
      }
    ], done);
  });
  Lab.after(function (done) {
    cleanBase(done);
  });

  Lab.test('move file in same directory (rename)', function (done) {
    moveFile(file1path, file1path+'.test', false, false, done);
  });

  Lab.test('move file into directory', function (done) {
    moveFile(file1path+'.test', dir1path+'/test_file1.txt.test', false, false, done);
  });

  Lab.test('move file into another directory', function (done) {
    moveFile(dir1path+'/test_file1.txt.test', dir2path+'/test_file1.txt.test', false, false, done);
  });

  Lab.test('move file out of directory', function (done) {
    moveFile(dir2path+'/test_file1.txt.test', file1path, false, false, done);
  });

  Lab.test('move file over existing file', function (done) {
    moveFile(file1path, file2path, false, false, function(err) {
      if(err) {
        if(err.code === 'EEXIST') {
          return done();
        }
        return done(err);
      }
      return done(new Error('file was not supposed to be moved'));
    });
  });

  Lab.test('move file over existing file with clobber', function (done) {
    moveFile(file1path, file2path, true, false, done);
  });

  Lab.test('move file to nonexisting path', function (done) {
    moveFile(file2path, '/fake/path.txt', false, false, function(err) {
      if(err) {
        if(err.code === 'ENOENT') {
          return done();
        }
        return done(err);
      }
      return done(new Error('file was not supposed to be moved'));
    });
  });

  Lab.test('move file to nonexisting path with clober', function (done) {
    moveFile(file2path, '/fake/path.txt', true, false, function(err) {
      if(err) {
        if(err.code === 'ENOENT') {
          return done();
        }
        return done(err);
      }
      return done(new Error('file was not supposed to be moved'));
    });
  });

  Lab.test('move file to nonexisting path with mkdirp', function (done) {
    moveFile(file2path, '/new/test.txt', false, true, done);
  });
});