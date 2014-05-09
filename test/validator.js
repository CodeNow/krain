var Lab = require('lab');
var server = require('../index.js');
var supertest = require('supertest');
var containerFullPath = __dirname+"/container1";
var escapePath = __dirname;
var containerId = "container1";
var fs = require('fs');
var async = require('async');
var rimraf = require('rimraf');
var path = require('path');

Lab.experiment('forbidden test', function () {
  Lab.test('DELETE', function (done) {
    supertest(server)
      .del("/test")
      .expect(403)
      .end(done);
  });
  Lab.test('POST', function (done) {
    supertest(server)
      .post("/test")
      .expect(403)
      .end(done);
    });
  Lab.test('PUT', function (done) {
    supertest(server)
      .put("/test")
      .expect(403)
      .end(done);
  });
  Lab.test('PUT with incorrect format', function (done) {
    supertest(server)
      .put("/test")
      .send({container: "invalid"})
      .expect(403)
      .end(done);
  });
  Lab.test('PUT with incorrect format', function (done) {
    supertest(server)
      .put("/test")
      .send({other: 'id'})
      .expect(403)
      .end(done);
  });
  Lab.test('GET', function (done) {
    supertest(server)
      .get("/test")
      .expect(403)
      .end(done);
  });
});

Lab.experiment('escape test', function () {
  Lab.beforeEach(function (done) {
    cleanBase(done);
  });
  Lab.afterEach(function (done) {
    rimraf.sync(containerFullPath);
    done();
  });

  function cleanBase(cb) {
    rimraf.sync(containerFullPath);
    fs.mkdirSync(containerFullPath);
    cb();
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

  Lab.test('try to create file out of container folder', function (done) {
    createFile('/../test.file', function(err) {
      if (err) {
        if (err.code === 'ENOENT') {
          return done();
        }
        return done(err);
      }
      return done(new Error('file excaped!!'));
    });
  });
  Lab.test('try to create file out of container folder', function (done) {
    createFile('/../../../../../test.file', function(err) {
      if (err) {
        if (err.code === 'ENOENT') {
          return done();
        }
        return done(err);
      }
      return done(new Error('file excaped!!'));
    });
  });
  Lab.test('try to create file out of container folder', function (done) {
    createFile('/./../test.file', function(err) {
      if (err) {
        if (err.code === 'ENOENT') {
          return done();
        }
        return done(err);
      }
      return done(new Error('file excaped!!'));
    });
  });
  Lab.test('try to create file out of container folder', function (done) {
    createFile('/".."/test.file', function(err) {
      if (err) {
        if (err.code === 'ENOENT') {
          return done();
        }
        return done(err);
      }
      return done(new Error('file excaped!!'));
    });
  });
  Lab.test('try to create file out of container folder', function (done) {
    createFile('~/test.file', function(err) {
      if (err) {
        if (err.code === 'ECONNRESET') {
          return done();
        }
        return done(err);
      }
      return done(new Error('file excaped!!'));
    });
  });
  Lab.test('try to create file out of container folder PUT', function (done) {
    supertest(server)
      .put('/../test.file')
      .send({container: {root: containerId}})
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
          return done(new Error('file excaped!!'));
        });
    });
  });
  Lab.test('try to delete file out of container folder', function (done) {
    supertest(server)
      .del('/../test.txt')
      .send({container: {root: containerId}})
      .end(function(err, res){
        if (err) {
          return done(err);
        }
        fs.stat(path.join(escapePath + '/file.txt'), function (err, stats) {
          if (err) {
            return done(err);
          }
          return done();
        });
    });
  });
  Lab.test('try to read file out of container folder', function (done) {
    fs.writeFileSync(escapePath + '/file.txt', 'testData');
    supertest(server)
      .get('/../file.txt')
      .send({container: {root: containerId}})
      .end(function(err, res){
        if (err) {
          return done(err);
        } else if (res.statusCode === 200) {
          return done(new Error('read excaped'));
        }
        return done();
    });
  });

  Lab.test('try to move file out of container folder', function (done) {
    fs.writeFileSync(containerFullPath + '/file.txt', 'testData');
    supertest(server)
      .post('/file.txt')
      .send({
        newPath: '/../file.txt',
        clobber: false,
        mkdirp: false,
        container : {root: containerId}
      })
      .end(function(err, res){
        if (err) {
          return done(err);
        } else if (200 !== res.statusCode) {
          if(res.body && res.body.code === 'EEXIST') {
            return done();
          }  
          return done(res.statusCode);  
        }
       return new Error('move excaped contaienr');
      });
  });
  Lab.test('try to move external file inside contaienr', function (done) {
    fs.writeFileSync(escapePath + '/file.txt', 'testData');
    supertest(server)
      .post('/../file.txt')
      .send({
        newPath: '/file.txt',
        clobber: false,
        mkdirp: false,
        container : {root: containerId}
      })
      .end(function(err, res){
        if (err) {
          return done(err);
        } else if (200 !== res.statusCode) {
          if(res.body && res.body.code === 'ENOENT') {
            return done();
          }  
          return done(res.statusCode);  
        }
       return new Error('move excaped contaienr');
      });
  });
 Lab.test('try to move external file outside contaienr', function (done) {
    fs.writeFileSync(escapePath + '/file.txt', 'testData');
    supertest(server)
      .post('/../file.txt')
      .send({
        newPath: '/../file2.text',
        clobber: false,
        mkdirp: false,
        container : {root: containerId}
      })
      .end(function(err, res){
        if (err) {
          return done(err);
        } else if (200 !== res.statusCode) {
          if(res.body && res.body.code === 'ENOENT') {
            return done();
          }  
          return done(res.statusCode);  
        }
       return new Error('move excaped contaienr');
      });
  });

});

  