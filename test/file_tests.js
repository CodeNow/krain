'use strict';
var Lab = require('lab');
var lab = exports.lab = Lab.script();
var fs = require('fs');
var server = require('../index.js');
var supertest = require('supertest');
var containerFullPath = __dirname+"/container1";
var containerId = "container1";
var request = require('request');
var path = require('path');
var async = require('async');
var rimraf = require('rimraf');

function cleanBase(cb) {
  rimraf(containerFullPath, function() {
    fs.mkdir(containerFullPath, cb);
  });
}

function createFile(filepath, opts, cb) {
  if(typeof opts === 'function') {
    cb = opts;
    opts = {};
  }
  var req = supertest(server)
    .put(filepath)
    .query({container: containerId});

  if (opts) {
    req.send(opts);
  }
  req.end(function(err){
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
  var req = supertest(server)
    .post(filepath)
    .query({container: containerId});

  if (opts) {
    req.send(opts);
  }
  req.end(function(err){
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
    .query({container: containerId})
    .send({
      newPath: newPath,
      clobber: doClobber,
      mkdirp: doMkdirp,
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
          fs.stat(containerFullPath+oldpath, function (err) {
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

lab.experiment('normal HTTP request', function () {
  lab.before(function (done) {
    cleanBase(done);
  });
  lab.after(function (done) {
    rimraf(containerFullPath, done);
  });

  lab.experiment('basic create tests', function () {
    lab.beforeEach(function (done) {
      cleanBase(done);
    });

    lab.test('create empty file PUT', function (done) {
      var filepath = '/test_file.txt';
      createFile(filepath, done);
    });

    lab.test('create empty file POST', function (done) {
      var filepath = '/test_file.txt';
      createFilePost(filepath, done);
    });

    lab.test('create empty file POST w/ encoding', function (done) {
      var filepath = '/test_file.txt';
      createFilePost(filepath, {encoding: "utf8"}, done);
    });

    lab.test('create empty file POST w/ mode', function (done) {
      var filepath = '/test_file.txt';
      createFilePost(filepath, {mode: 777}, done);
    });

    lab.test('create empty file POST w/ content', function (done) {
      var filepath = '/test_file.txt';
      createFilePost(filepath, {content: "testText"}, done);
    });

    lab.test('create empty file PUT w/ encoding', function (done) {
      var filepath = '/test_file.txt';
      createFile(filepath, {encoding: "utf8"}, done);
    });

    lab.test('create empty file PUT w/ mode', function (done) {
      var filepath = '/test_file.txt';
      createFile(filepath, {mode: 777}, done);
    });

    lab.test('create file with spaces in filename PUT', function (done) {
      var filepath = '/test file.txt';
      createFile(filepath, done);
    });

    lab.test('create file with text PUT', function (done) {
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

    lab.test('create file with text and spaces in file name PUT', function (done) {
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

    lab.test('create file in path that does not exist PUT', function (done) {
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

    lab.test('overwrite file PUT', function (done) {
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
          .query({container: containerId})
          .end(function(err, res){
            if (err) {
              return cb(err);
            } else if (200 !== res.statusCode) {
              return cb(err, res);
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
  lab.experiment('basic delete tests', function () {
    lab.beforeEach(function (done) {
      cleanBase(done);
    });

    lab.test('delete file', function (done) {
      var filepath = '/test_file.txt';
      createFile(filepath, function(err) {
        if (err) {
          return done(err);
        }
        rmFile(filepath, done);
      });
    });

    lab.test('delete file that does not exist', function (done) {
      rmFile('/fake.txt', function(err, res){
        if(err) {
          return done(err);
        }
        Lab.expect(res.statusCode).to.equal(404);
        return done();
      });
    });

    lab.test('try to delete folder', function (done) {
      createDir(containerFullPath+'/delete_me', function (err) {
        rmFile('/delete_me', function (err, res) {
          if (err) {
            return done(err);
          }
          if (res.statusCode === 400 || res.statusCode === 403){
            return done();
          }
          return done(new Error('should not delete folder'));
        });
      });
    });
  });

  var readFile= function (filepath, query, cb) {
    if(typeof query === 'function') {
      cb = query;
      query = {};
    }
    query.container = containerId;

    supertest(server)
      .get(filepath)
      .query(query)
      .end(cb);
  };

  lab.experiment('read tests', function () {
    var file1path = '/test_file1.txt';
    var file2path = '/test_file2.txt';
    var fileContent = "test";

    lab.before(function (done) {
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

    lab.after(function (done) {
      cleanBase(done);
    });

    lab.test('read file', function (done) {
      readFile(file2path, function(err, res) {
        if (err) {
          return done(err);
        } else if (!~fileContent.indexOf(res.text)) {
          return done(new Error('file read wrong data'));
        }
        return done();
      });
    });

    lab.test('read file utf8', function (done) {
      readFile(file2path, {encoding: 'utf8'}, function(err, res) {
          if (err) {
            return done(err);
          } else if (!~fileContent.indexOf(res.text)) {
            return done(new Error('file read wrong data'));
          }
          return done();
        });
    });

    lab.test('read empty file', function (done) {
      readFile(file1path, {encoding: 'utf8'}, function(err, res) {
          if (err) {
            return done(err);
          } else if (res.text !== "") {
            return done(new Error('file should be empty'));
          }
          return done();
        });
    });

    lab.test('read file with redirect', function (done) {
      readFile(file2path+'/', function(err, res) {
          if (err) {
            return done(err);
          } else if (!~res.text.indexOf('Redirecting to '+file2path)) {
            return done(new Error('not redirecting'));
          }
          return done();
        });
    });

    lab.test('read empty file with redirect', function (done) {
      readFile(file1path+'/', function(err, res) {
          if (err) {
            return done(err);
          } else if (!~res.text.indexOf('Redirecting to '+file1path)) {
            return done(new Error('not redirecting'));
          }
          return done();
        });
    });

    lab.test('read file that does not exist', function (done) {
      readFile(file1path+'.fake.txt', function(err, res) {
          if (err) {
            return done(err);
          }
          Lab.expect(res.statusCode).to.equal(404);
          return done();
        });
    });
  });

  lab.experiment('move tests', function () {
    var dir1path =  '/test_dir1/';
    var dir2path =  '/test_dir2/';
    var file1path = '/test_file1.txt';
    var file2path = '/test_file2.txt';
    var fileContent = "test";

    lab.before(function (done) {
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
    lab.after(function (done) {
      cleanBase(done);
    });

    lab.test('move file in same directory (rename)', function (done) {
      moveFile(file1path, file1path+'.test', false, false, done);
    });

    lab.test('move file into directory', function (done) {
      moveFile(file1path+'.test', dir1path+'/test_file1.txt.test', false, false, done);
    });

    lab.test('move file into another directory', function (done) {
      moveFile(dir1path+'/test_file1.txt.test', dir2path+'/test_file1.txt.test', false, false, done);
    });

    lab.test('move file out of directory', function (done) {
      moveFile(dir2path+'/test_file1.txt.test', file1path, false, false, done);
    });

    lab.test('move file over existing file', function (done) {
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

    lab.test('move file over existing file with clobber', function (done) {
      moveFile(file1path, file2path, true, false, done);
    });

    lab.test('move file to nonexisting path', function (done) {
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

    lab.test('move file to nonexisting path with clober', function (done) {
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

    lab.test('move file to nonexisting path with mkdirp', function (done) {
      moveFile(file2path, '/new/test.txt', false, true, done);
    });
  });
});

lab.experiment('stream tests', function () {
  var app;
  lab.beforeEach(cleanBase);
  lab.beforeEach(function(done){
    app = server.listen(testPort,done);
  });
  lab.afterEach(function(done){
    app.close(done);
  });
  lab.after(function (done) {
    rimraf(containerFullPath, done);
  });

  var testPort = 52232;
  var dataFile = containerFullPath+'/data.txt';
  var testText = 'lots of text';
  var testFile = '/stream_test.txt';
  var testFilePath = containerFullPath+testFile;

  lab.test('POST - stream file', function (done) {
    fs.writeFileSync(dataFile, testText);

    var r = request({
      url: 'http://localhost:'+testPort+testFile,
      method: 'POST',
      pool: false,
      qs: {
        container: containerId
      }
    }, function(err, res) {
      if (err) { return done(err); }
      var body = JSON.parse(res.body);

      Lab.expect(res.statusCode).to.equal(201);
      Lab.expect(body.name).to.equal(path.basename(testFile));
      Lab.expect(body.path).to.equal(path.dirname(testFile));
      Lab.expect(body.isDir).to.equal(false);

      var data = fs.readFileSync(testFilePath);
      Lab.expect(data.toString()).to.equal(testText);
      done();
    });
    fs.createReadStream(dataFile).pipe(r);
  });

  lab.test('POST - stream existing file with clobber', function (done) {
    fs.writeFileSync(dataFile, testText);
    fs.writeFileSync(testFilePath, testText);

    var r = request({
      url: 'http://localhost:'+testPort+testFile,
      qs: {
        clobber: true,
        container: containerId
      },
      method: 'POST',
      pool: false
    }, function(err, res) {
      if (err) { return done(err); }

      var body = JSON.parse(res.body);

      Lab.expect(res.statusCode).to.equal(201);
      Lab.expect(body.name).to.equal(path.basename(testFile));
      Lab.expect(body.path).to.equal(path.dirname(testFile));
      Lab.expect(body.isDir).to.equal(false);

      var data = fs.readFileSync(testFilePath);
      Lab.expect(data.toString()).to.equal(testText);
      done();
    });
    fs.createReadStream(dataFile).pipe(r);
  });

  lab.test('POST - stream file with clobber, mode, and encoding', function (done) {
    fs.writeFileSync(dataFile, testText);

    var r = request({
      url: 'http://localhost:'+testPort+testFile,
      qs: {
        clobber: true,
        mode: '0666',
        encoding: 'utf8',
        container: containerId
      },
      method: 'POST',
      pool: false
    }, function(err, res) {
      if (err) { return done(err); }

      var body = JSON.parse(res.body);

      Lab.expect(res.statusCode).to.equal(201);
      Lab.expect(body.name).to.equal(path.basename(testFile));
      Lab.expect(body.path).to.equal(path.dirname(testFile));
      Lab.expect(body.isDir).to.equal(false);

      var data = fs.readFileSync(testFilePath);
      Lab.expect(data.toString()).to.equal(testText);
      done();
    });
    fs.createReadStream(dataFile).pipe(r);
  });

  lab.test('POST - stream existing file with out clobber', function (done) {
    fs.writeFileSync(dataFile, testText);
    fs.writeFileSync(testFilePath, testText);
    var data = fs.readFileSync(testFilePath);
    Lab.expect(data.toString()).to.equal(testText);
    var r = request({
      url: 'http://localhost:'+testPort+testFile,
      method: 'POST',
      pool: false,
      qs: {
        container: containerId
      }
    }, function(err, res) {
      if (err) { return done(err); }

      Lab.expect(res.statusCode).to.equal(409);
      return done();
    });

    fs.createReadStream(dataFile).pipe(r);
  });

  lab.test('POST - stream over folder', function (done) {
    fs.writeFileSync(dataFile, testText);
    fs.mkdirSync(testFilePath);

    var r = request({
      url: 'http://localhost:'+testPort+testFile,
      method: 'POST',
      pool: false,
      qs: {
        container: containerId
      }
    }, function(err, res) {
      if (err) { return done(err); }

      Lab.expect(res.statusCode).to.equal(409);
      done();
    });
    fs.createReadStream(dataFile).pipe(r);
  });

  lab.test('POST - stream over folder with clobber', function (done) {
    fs.writeFileSync(dataFile, testText);
    fs.mkdirSync(testFilePath);

    var r = request({
      url: 'http://localhost:'+testPort+testFile,
      qs: {
        clobber: true,
        container: containerId
      },
      method: 'POST',
      pool: false
    }, function(err, res) {
      if (err) { return done(err); }

      Lab.expect(res.statusCode).to.equal(400);
      done();
    });
    fs.createReadStream(dataFile).pipe(r);
  });

  lab.test('POST - stream to path which does not exist', function (done) {
    fs.writeFileSync(dataFile, testText);

    var r = request({
      url: 'http://localhost:'+testPort+'/fake'+testFile,
      method: 'POST',
      pool: false,
      qs: {
        container: containerId
      }
    }, function(err, res) {
      if (err) { return done(err); }

      Lab.expect(res.statusCode).to.equal(404);
      done();
    });
    fs.createReadStream(dataFile).pipe(r);
  });

  lab.test('POST - stream to path which does not exist with clobber', function (done) {
    fs.writeFileSync(dataFile, testText);

    var r = request({
      url: 'http://localhost:'+testPort+'/fake'+testFile,
      qs: {
        clobber: true,
        container: containerId
      },
      method: 'POST',
      pool: false
    }, function(err, res) {
      if (err) { return done(err); }

      Lab.expect(res.statusCode).to.equal(404);
      done();
    });
    fs.createReadStream(dataFile).pipe(r);
  });

  lab.test('POST - stream to path with different headers', function (done) {
    fs.writeFileSync(dataFile, testText);

    var r = request({
      url: 'http://localhost:'+testPort+testFile,
      method: 'POST',
      pool: false,
      qs: {
        container: containerId
      },
      headers: {
        'content-type': 'application/json'
      }
    }, function(err, res) {
      if (err) { return done(err); }
      Lab.expect(res.statusCode).to.equal(500);
      done();
    });
    fs.createReadStream(dataFile).pipe(r);
  });
});
