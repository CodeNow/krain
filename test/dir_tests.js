'use strict';
require('../lib/loadenv.js')();
var Lab = require('lab');
var lab = exports.lab = Lab.script();
var fs = require('fs');
var server = require('../index.js');
var supertest = require('supertest');
var async = require('async');
var rimraf = require('rimraf');
var walk = require('walkdir');
var path = require('path');
var containerId = "container1";
var idFilePath = __dirname+"/" + containerId;
var idFileFullPath = __dirname+"/" + containerId + '/id-file';
var fileId = "hljkh234lkj5h234lkj5hfvsdf";
var containerFullPath = __dirname+"/" + fileId;

// attach the .compare method to Array's prototype to call it on any array
Array.prototype.compare = function (array) {
  if (!array) {
    return false;
  }
  if (this.length !== array.length) {
    return false;
  }
  var isMatch = false;
  for (var me in this) {
    isMatch = false;
    for (var other in array) {
      if (me === other) {
        isMatch = true;
        break;
      }
    }
    if(!isMatch) {
      return false;
    }
  }
  return true;
};

lab.before(function (done) {
  cleanBase(done);
});
lab.after(function (done) {
  rimraf(containerFullPath, function () {
    rimraf(idFilePath, done);
  });
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

function createDir(dirpath, opts, cb) {
  if(typeof opts === 'function') {
    cb = opts;
    opts = {};
  }

  var req = supertest(server)
    .put(dirpath)
    .query({container: containerId})
    .send(opts);

  req.expect(201).end(function(err){
    if (err) {
      return cb(err);
    }
    fs.stat(containerFullPath+dirpath, function (err, stats) {
      if (err) {
        return cb(err);
      } else if (!stats.isDirectory()) {
        return cb(new Error('dir did not get created'));
      } else {
        return cb();
      }
    });
  });
}

function createDirPost(dirpath, opts, cb) {
  if(typeof opts === 'function') {
    cb = opts;
    opts = {};
  }
  var req = supertest(server)
    .post(dirpath)
    .query({container: containerId})
    .send(opts);

  req.expect(201).end(function(err){
    if (err) {
      return cb(err);
    }
    fs.stat(containerFullPath+dirpath, function (err, stats) {
      if (err) {
        return cb(err);
      } else if (!stats.isDirectory()) {
        return cb(new Error('dir did not get created'));
      } else {
        return cb();
      }
    });
  });
}
function createFile(filepath, text, cb) {
  var data = text || '';
  fs.writeFile(containerFullPath + filepath, data, cb);
}

function moveDir(oldpath, newPath, doClobber, doMkdirp, cb) {
  getDirContents(containerFullPath+oldpath, function(err, oldPaths) {
    if(err) {
      return cb(err);
    }
    supertest(server)
      .post(oldpath)
      .query({container: containerId})
      .send({
        newPath: newPath,
        clobber: doClobber,
        mkdirp: doMkdirp,
      })
      .end(function(err, res) {
        if (err) {
          return cb(err);
        } else if (200 !== res.statusCode) {
          return cb(res.body);
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
                return next(new Error('old dir did not move'));
              }
            });
          },
          function(next) {
            // new path should exist
            fs.stat(containerFullPath+newPath, function (err, stats) {
              if (err) {
                return next(err);
              } else if (stats.isDirectory()) {
                return next();
              } else {
                return next(new Error('dir did not get moved correctly'));
              }
            });
          },
          function(next) {
            // new dir structure should match old structure
            getDirContents(containerFullPath+newPath, function(err, newPaths) {
              if(err) return next(err);
              if(newPaths.compare(oldPaths)) {
                return next();
              } else {
                return next(new Error('new dir does not match moved one'));
              }
            });
          }
        ], cb);
      });
  });
}

function getDirContents(dirPath, cb) {
  // remove trailing slash
  if (dirPath.substr(-1) === '/') {
    dirPath = dirPath.substr(0, dirPath.length - 1);
  }
  var paths = [];
  var error = null;
  var emitter = walk(dirPath, function(path,stat){
    paths.push(path.substr(dirPath.length));
  });
  emitter.on('end', function() {
    return cb(error, paths);
  });
  emitter.on('error', function(err) {
    error = new Error("error on file: "+err);
    error.code = 'EINVAL';
    emitter.end();
  });
}

/*

      START TEST

*/

lab.experiment('create tests', function () {
  lab.beforeEach(function (done) {
    cleanBase(done);
  });
  lab.test('create dir POST', function (done) {
    var dirpath = '/dir2/';
    createDirPost(dirpath, done);
  });
  lab.test('create dir POST with mode 400', function (done) {
    var dirpath = '/dir2/';
    createDirPost(dirpath, {mode: 400}, done);
  });
  lab.test('create dir PUT', function (done) {
    var dirpath = '/dir2/';
    createDir(dirpath, done);
  });
  lab.test('create dir PUT with mode 400', function (done) {
    var dirpath = '/dir2/';
    createDir(dirpath, {mode: 400}, done);
  });
});


lab.experiment('basic delete tests', function () {
  lab.beforeEach(function (done) {
    cleanBase(done);
  });
  lab.test('delete dir', function (done) {
    var dirpath = '/dir2/';
    createDir(dirpath, function(err) {
      if (err) {
        return done(err);
      }
      supertest(server)
        .del(dirpath)
        .query({container: containerId})
        .expect(200)
        .end(function(err, res){
          if (err) {
            return done(err);
          }
          fs.stat(containerFullPath+dirpath, function (err, stats) {
            if (err) {
              if (err.code === 'ENOENT') {
                return done();
              }
              return done(err);
            } else {
              return done(new Error('dir did not get deleted'));
            }
          });
        });
    });
  });

  lab.test('delete nonexiting dir', function (done) {
    var dirpath = '/dir2/fake';
    supertest(server)
      .del(dirpath)
      .query({container: containerId})
      .expect(404)
      .end(function(err, res){
        if (err) {
          return done(err);
        }
        fs.stat(containerFullPath+dirpath, function (err, stats) {
          if (err) {
            if (err.code === 'ENOENT') {
              return done();
            }
            return done(err);
          } else {
            return done(new Error('dir did not get deleted'));
          }
        });
      });
  });

  lab.test('attempt to delete file', function (done) {
    var filePath = '/file';
    createFile(filePath, "test", function (err) {
      if(err) return done(err);
      supertest(server)
        .del(filePath+'/')
        .query({container: containerId})
        .expect(400)
        .end(done);
    });
  });

});


lab.experiment('read tests', function () {
  var dir1R =  '/dir2';
  var dir1 =  dir1R+'/';
  var dir2R = '/dir1';
  var dir2 =  dir2R+'/';
  var file1 = '/test_file1.txt';
  var dir1_file1 = dir1+'test_file2.txt';
  var fileContent = "test";

  lab.beforeEach(function (done) {
    async.series([
      function(cb) {
        cleanBase(cb);
      },
      function(cb) {
        createDir(dir1, cb);
      },
      function(cb) {
        createDir(dir2, cb);
      },
      function(cb) {
        createFile(file1, fileContent, cb);
      },
      function(cb) {
        createFile(dir1_file1, fileContent, cb);
      }
    ], done);
  });

  lab.test('get dir ls', function (done) {
    supertest(server)
      .get(dir1)
      .query({container: containerId})
      .expect(200)
      .end(function(err, res){
        if (err) {
          return done(err);
        } else if (res.body[0].path !== dir1R || res.body[0].name !== path.basename(dir1_file1)) {
          return done(new Error('file list incorrect'));
        }
        return done();
      });
  });

  lab.test('get filled dir ls', function (done) {
    supertest(server)
      .get('/')
      .query({container: containerId})
      .expect(200)
      .end(function(err, res){
        if (err) {
          return done(err);
        } else if (res.body.length != 3) {
          return done(new Error('file list incorrect'));
        }
        return done();
      });
  });

  lab.test('get dir ls recursive', function (done) {
    supertest(server)
      .get('/')
      .query({container: containerId, recursive: "true"})
      .expect(200)
      .end(function(err, res){
        if (err) {
          return done(err);
        } else if (res.body.length != 5) {
          return done(new Error('file list incorrect'));
        }
        return done();
      });
  });

  lab.test('get empty dir ls', function (done) {
    supertest(server)
      .get(dir2)
      .query({container: containerId})
      .expect(200)
      .end(function(err, res){
        if (err) {
          return done(err);
        } else if (res.body.length) {
          return done(new Error('file list incorrect'));
        }
        return done();
      });
  });

  lab.test('get dir ls with redirect', function (done) {
    supertest(server)
      .get(dir1R)
      .query({container: containerId})
      .expect(303)
      .end(function(err, res){
        if (err) {
          return done(err);
        } else if (!~res.text.indexOf('Redirecting to '+dir1)) {
          return done(new Error('not redirecting'));
        }
        return done();
      });
  });

  lab.test('get empty dir ls with redirect', function (done) {
    supertest(server)
      .get(dir2R)
      .query({container: containerId})
      .expect(303)
      .end(function(err, res){
        if (err) {
          return done(err);
        } else if (!~res.text.indexOf('Redirecting to '+dir2)) {
          return done(new Error('not redirecting'));
        }
        return done();
      });
  });

  lab.test('get dir which does not exist', function (done) {
    supertest(server)
      .get(dir2R+"/fake")
      .query({container: containerId})
      .expect(404)
      .end(done);
  });
});


lab.experiment('move tests', function () {
  var dir1 =  '/dir1/';
  var dir2 =  '/dir2/'; // empty
  var dir3 =  '/dir3/';

  var dir1_file1 = dir1+'test_file1.txt';
  var dir1_dir1  = dir1+'dir1/';
  var dir1_dir1_file1 = dir1_dir1+'test_file2.txt';

  var dir3_file1 = dir3+'test_file1.txt';

  var fileContent = "test";

  lab.beforeEach(function (done) {
    async.series([
      function(cb) {
        cleanBase(cb);
      },
      function(cb) {
        createDir(dir1, cb);
      },
      function(cb) {
        createDir(dir2, cb);
      },
      function(cb) {
        createDir(dir3, cb);
      },
      function(cb) {
        createDir(dir1_dir1, cb);
      },
      function(cb) {
        createFile(dir1_file1, fileContent, cb);
      },
      function(cb) {
        createFile(dir3_file1, fileContent, cb);
      },
      function(cb) {
        createFile(dir1_dir1_file1, fileContent, cb);
      }
    ], done);
  });

  lab.test('move empty dir in same dir (rename) with trailing slash', function (done) {
    moveDir(dir2, '/new/', false, false, done);
  });
  lab.test('move empty dir in same dir (rename) without trailing slash', function (done) {
    moveDir(dir2, '/new', false, false, done);
  });
  lab.test('move empty dir to itself', function (done) {
    moveDir(dir2, dir2, false, false, function(err) {
      if(err) {
        if (err.code === 'EEXIST') {
          return done();
        }
        return done(err);
      }
      return done(new Error('dir was moved on top of itself'));
    });
  });
  lab.test('move empty dir to same dir with similar name', function (done) {
    moveDir(dir2, dir2.substr(0, dir2.length - 1)+"add", false, false, done);
  });
  lab.test('move empty dir into a dir with trailing slash', function (done) {
    moveDir(dir2, dir1+'new/', false, false, done);
  });
  lab.test('move empty dir into a dir without trailing slash', function (done) {
    moveDir(dir2, dir1+'new', false, false, done);
  });
  lab.test('move empty dir into itself', function (done) {
    moveDir(dir2, dir2+'new/', false, false, function(err) {
      if(err) {
        if (err.code === 'EPERM') {
          return done();
        }
        return done(err);
      }
      return done(new Error('dir was moved into itself'));
    });
  });

  lab.test('move empty dir out of dir', function (done) {
    moveDir(dir2, dir1+'new/', false, false, function(err) {
      if (err) return done(err);
      moveDir(dir1+'new/', dir2, false, false, done);
    });
  });

  lab.test('move empty dir onto existing dir', function (done) {
    moveDir(dir2, dir1, false, false, function(err) {
      if(err) {
        if (err.code === 'EEXIST') {
          return done();
        }
        return done(err);
      }
      return done(new Error('dir was overritting without clobber'));
    });
  });

  lab.test('move empty dir onto existing dir with clobber', function (done) {
    moveDir(dir2, dir1, true, false, done);
  });

  lab.test('move empty dir into non existing dir', function (done) {
    moveDir(dir2, dir1+'fake/dir/', false, false, function(err) {
      if(err) {
        if (err.code === 'ENOENT') {
          return done();
        }
        return done(err);
      }
      return done(new Error('dir was created without mkdirp'));
    });
  });

  lab.test('move empty dir into non existing dir with mkdirp', function (done) {
    moveDir(dir2, dir1+'fake/dir/', false, true, done);
  });

  lab.test('move empty dir into non existing long dir with mkdirp', function (done) {
    moveDir(dir2, dir1+'fake/long/long/long/dir/', false, true, done);
  });

  // now try with full dir
  lab.test('move dir in same dir (rename) with trailing slash', function (done) {
    moveDir(dir1, '/new/', false, false, done);
  });
  lab.test('move dir in same dir (rename) without trailing slash', function (done) {
    moveDir(dir1, '/new', false, false, done);
  });
  lab.test('move dir into a dir with trailing slash', function (done) {
    moveDir(dir1, dir2+'new/', false, false, done);
  });
  lab.test('move dir into a dir without trailing slash', function (done) {
    moveDir(dir1, dir2+'new', false, false, done);
  });
  lab.test('move dir to itself', function (done) {
    moveDir(dir1, dir1, false, false, function(err) {
      if(err) {
        if (err.code === 'EEXIST') {
          return done();
        }
        return done(err);
      }
      return done(new Error('dir was moved on top of itself'));
    });
  });
  lab.test('move dir to same dir with similar name', function (done) {
    moveDir(dir1, dir1.substr(0, dir2.length - 1)+"add", false, false, done);
  });
  lab.test('move dir to itself', function (done) {
    moveDir(dir1, dir1, false, false, function(err) {
      if(err) {
        if (err.code === 'EEXIST') {
          return done();
        }
        return done(err);
      }
      return done(new Error('dir was moved on top of itself'));
    });
  });

  lab.test('move dir into itself', function (done) {
    moveDir(dir1, dir1+'new/', false, false, function(err) {
      if(err) {
        if (err.code === 'EPERM') {
          return done();
        }
        return done(err);
      }
      return done(new Error('dir was moved into itself'));
    });
  });

  lab.test('move dir out of dir', function (done) {
    moveDir(dir1, dir2+'new/', false, false, function(err) {
      if (err) return done(err);
      moveDir(dir2+'new/', dir1, false, false, done);
    });
  });

  lab.test('move dir onto existing dir', function (done) {
    moveDir(dir1, dir2, false, false, function(err) {
      if(err) {
        if (err.code === 'EEXIST') {
          return done();
        }
        return done(err);
      }
      return done(new Error('dir was overritting without clobber'));
    });
  });

  lab.test('move dir onto existing dir with clobber', function (done) {
    moveDir(dir1, dir2, true, false, done);
  });

  lab.test('move dir into non existing dir', function (done) {
    moveDir(dir1, dir2+'fake/dir/', false, false, function(err) {
      if(err) {
        if (err.code === 'ENOENT') {
          return done();
        }
        return done(err);
      }
      return done(new Error('dir was created without mkdirp'));
    });
  });

  lab.test('move dir into non existing dir with mkdirp', function (done) {
    moveDir(dir1, dir2+'fake/dir/', false, true, done);
  });

  lab.test('move dir into non existing long dir with mkdirp', function (done) {
    moveDir(dir1, dir2+'fake/long/long/long/dir/', false, true, done);
  });

  lab.test('clober from inside dir to an empty one above it', function (done) {
    moveDir(dir1_dir1, dir2, false, false, function(err) {
      if(err) {
        if (err.code === 'EEXIST') {
          return done();
        }
        return done(err);
      }
      return done(new Error('dir was overwritten without clober'));
    });
  });

  lab.test('clober from inside dir to an empty one above it with clober', function (done) {
    moveDir(dir1_dir1, dir2, true, false, done);
  });

  lab.test('clober from inside dir to an full one above it', function (done) {
    moveDir(dir1_dir1, dir3, false, false, function(err) {
      if(err) {
        if (err.code === 'EEXIST') {
          return done();
        }
        return done(err);
      }
      return done(new Error('dir was overwritten without clober'));
    });
  });

  lab.test('clober from inside dir to an full one above it with clobber', function (done) {
    moveDir(dir1_dir1, dir3, true, false, done);
  });

});
