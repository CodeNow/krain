'use strict';
var Lab = require('lab');
var lab = exports.lab = Lab.script();
var server = require('../index.js');
var app = require('../lib/app.js');
var supertest = require('supertest');
var escapePath = __dirname;
var containerId = "container1";
var idFilePath = __dirname+"/" + containerId;
var idFileFullPath = __dirname+"/" + containerId + '/mount-id';
var fileId = "hljkh234lkj5h234lkj5hfvsdf";
var containerFullPath = __dirname+"/" + fileId;
var fs = require('fs');
var async = require('async');
var rimraf = require('rimraf');
var path = require('path');

lab.experiment('forbidden test', function () {
  lab.test('DELETE', function (done) {
    supertest(server)
      .del("/test")
      .expect(400)
      .end(done);
  });
  lab.test('POST', function (done) {
    supertest(server)
      .post("/test")
      .expect(400)
      .end(done);
    });
  lab.test('PUT', function (done) {
    supertest(server)
      .put("/test")
      .expect(400)
      .end(done);
  });
  lab.test('PUT with incorrect format', function (done) {
    supertest(server)
      .put("/test")
      .send({container: "invalid"})
      .expect(400)
      .end(done);
  });
  lab.test('PUT with incorrect format', function (done) {
    supertest(server)
      .put("/test")
      .send({other: 'id'})
      .expect(400)
      .end(done);
  });
  lab.test('GET', function (done) {
    supertest(server)
      .get("/test")
      .expect(400)
      .end(done);
  });
});

lab.experiment('Path Validator test', function () {
  var failStrings = [
     '/../asdasd/sadasd',
     'asdasdasd/asdasd/../asdasdasd',
     '../asdasdasd/asdasdas/..asdasdas/dasds.sdasd.sdads'
  ];
  var passStrings = [
    'asdasd/sasdas.as/..asdasdasd/.a../.asdasdas.das.das.d.asd.as.d.asd.',
    '/file.txt'
  ];
  lab.test('should fail all fail strings', function (done) {
    var failedMessage = null;
    var pass = failStrings.every(function (failPath) {
      if (!app.isPathInvalid(failPath)) {
        failedMessage = failPath + 'should have failed';
        return false
      }
      return true
    });
    if (pass) {
      done()
    } else {
      done(new Error(failedMessage))
    }
  });
  lab.test('should pass all success strings', function (done) {
    var failedMessage = null;
    var pass = passStrings.every(function (passPath) {
      if (app.isPathInvalid(passPath)) {
        failedMessage = passPath + 'should have passed';
        return false
      }
      return true
    });
    if (pass) {
      done()
    } else {
      done(new Error(failedMessage))
    }
  });
});

lab.experiment('escape test', function () {
  lab.beforeEach(function (done) {
    rimraf.sync(containerFullPath);
    rimraf.sync(idFilePath);
    done();
  });
  lab.test('try to read from docker id file, but it fails', function (done) {
    supertest(server)
      .get('/file.txt')
      .query({container: containerId})
      .end(function (err, res) {
        if (err) {
          return done(err);
        } else if (500 === res.statusCode) {
          return done();
        }
        return done(new Error('should have fetched id file for folder location'));
      });
  });
});

lab.experiment('escape test', function () {
  lab.beforeEach(function (done) {
    cleanBase(done);
  });
  lab.afterEach(function (done) {
    rimraf.sync(containerFullPath);
    rimraf.sync(idFilePath);
    done();
  });
  function cleanBase(cb) {
    rimraf(containerFullPath, function() {
      fs.mkdir(containerFullPath, function () {
        rimraf(idFilePath, function() {
          fs.mkdir(idFilePath, function () {
            fs.writeFile(idFileFullPath, fileId, cb)
          });
        });
      });
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
    req.end(function(err, res){
      if (err) {
        return cb(err);
      }
      fs.stat(path.join(escapePath,filepath), function (err, stats) {
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

  lab.test('try to create file out of container folder', function (done) {
    createFile('/../test.file', function(err) {
      if (err) {
        if (err.code === 'ENOENT') {
          return done();
        }
        return done(err);
      }
      return done(new Error('file escaped!!'));
    });
  });
  lab.test('try to create file out of container folder', function (done) {
    createFile('/../../../../../test.file', function(err) {
      if (err) {
        if (err.code === 'ENOENT') {
          return done();
        }
        return done(err);
      }
      return done(new Error('file escaped!!'));
    });
  });
  lab.test('try to create file out of container folder', function (done) {
    createFile('/./../test.file', function(err) {
      if (err) {
        if (err.code === 'ENOENT') {
          return done();
        }
        return done(err);
      }
      return done(new Error('file escaped!!'));
    });
  });
  lab.test('try to create file out of container folder', function (done) {
    createFile('/".."/test.file', function(err) {
      if (err) {
        if (err.code === 'ENOENT') {
          return done();
        }
        return done(err);
      }
      return done(new Error('file escaped!!'));
    });
  });
  lab.test('try to create file out of container folder', function (done) {
    createFile('~/test.file', function(err) {
      if (err) {
        if (err.code === 'ECONNRESET') {
          return done();
        }
        return done(err);
      }
      return done(new Error('file escaped!!'));
    });
  });
  lab.test('try to create file out of container folder PUT', function (done) {
    supertest(server)
      .put('/../test.file')
      .query({container: containerId})
      .end(function(err, res){
        if (err) {
          return done(err);
        }
        fs.stat(path.join(escapePath,'test.file'), function (err, stats) {
          if (err) {
            if (err.code === 'ENOENT') {
              return done();
            }
            return done(err);
          }
          return done(new Error('file escaped!!'));
        });
    });
  });
  lab.test('try to delete file out of container folder', function (done) {
    fs.writeFileSync(escapePath + '/file.txt', 'testData');
    supertest(server)
      .del('/../file.txt')
      .query({container: containerId})
      .end(function(err, res){
        if (err) {
          return done(err);
        }
        fs.stat(path.join(escapePath + '/file.txt'), function (err, stats) {
          fs.unlinkSync(escapePath + '/file.txt', 'testData');
          if (err) {
            return done(err);
          }
          return done();
        });
    });
  });
  lab.test('try to read file out of container folder', function (done) {
    fs.writeFileSync(escapePath + '/file.txt', 'testData');
    supertest(server)
      .get('/../file.txt')
      .query({container: containerId})
      .end(function(err, res){
        fs.unlinkSync(escapePath + '/file.txt', 'testData');
        if (err) {
          return done(err);
        } else if (res.statusCode === 200) {
          return done(new Error('read escaped'));
        }
        return done();
    });
  });

  lab.test('try to move file out of container folder', function (done) {
    fs.writeFileSync(containerFullPath + '/file.txt', 'testData');
    supertest(server)
      .post('/file.txt')
      .query({container: containerId})
      .send({
        newPath: '/../file.txt',
        clobber: false,
        mkdirp: false,
      })
      .end(function(err, res){
        if (err) {
          return done(err);
        } else if (403 === res.statusCode) {
          return done();
        }
       return new Error('move escaped container');
      });
  });
  lab.test('try to move external file inside container', function (done) {
    fs.writeFileSync(escapePath + '/../file.txt', 'testData');
    supertest(server)
      .post('/../file.txt')
      .query({container: containerId})
      .send({
        newPath: '/file.txt',
        clobber: false,
        mkdirp: false,
      })
      .end(function(err, res){
        fs.unlinkSync(escapePath + '/../file.txt', 'testData');
        if (err) {
          return done(err);
        } else if (403 === res.statusCode) {
          return done();
        }
       return done(new Error('move escaped container'));
      });
  });
  lab.test('try to move external file outside container', function (done) {
    fs.writeFileSync(escapePath + '/file.txt', 'testData');
    supertest(server)
      .post('/../file.txt')
      .query({container: containerId})
      .send({
        newPath: '/../file2.text',
        clobber: false,
        mkdirp: false,
      })
      .end(function(err, res){
        fs.unlinkSync(escapePath + '/file.txt', 'testData');
        if (err) {
          return done(err);
        } else if (403 === res.statusCode) {
          return done();
        }
        return done(new Error('move escaped container'));
      });
  });
  lab.test('try to read external file outside container', function (done) {
    supertest(server)
      .get('/../file.txt')
      .query({container: containerId})
      .end(function(err, res){
        if (err) {
          return done(err);
        } else if (403 === res.statusCode) {
          return done();
        }
        return done(new Error('fetched escaped container'));
      });
  });
  lab.test('should fail when attempting a relative path', function (done) {
    supertest(server)
      .get('../file.txt')
      .query({container: containerId})
      .end(function(err){
        if (err) {
          return done();
        }
        return done(new Error('fetched escaped container'));
      });
  });
  lab.test('try to read external file outside container with .. in the middle', function (done) {
    supertest(server)
      .get('/hello/../../../..file.txt')
      .query({container: containerId})
      .end(function(err, res){
        if (err) {
          return done(err);
        } else if (403 === res.statusCode) {
          return done();
        }
        return done(new Error('fetched escaped container'));
      });
  });
  lab.test('try to read external file outside container through container param', function (done) {
    supertest(server)
      .get('/?container=/../file.txt')
      .end(function(err, res){
        if (err) {
          return done(err);
        } else if (400 === res.statusCode) {
          return done();
        }
        return done(new Error('fetched escaped container'));
      });
  });
  lab.test('empty process.env.FS_POSTFIX test' , function (done) {
    process.env.FS_POSTFIX = ' ';
    createFile('/".."/test.file', function(err) {
      if (err) {
        if (err.code === 'ENOENT') {
          return done();
        }
        return done(err);
      }
      return done(new Error('file escaped!!'));
    });
  });
});

