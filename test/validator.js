var Lab = require('lab');
var server = require('../index.js');
var supertest = require('supertest');
var containerFullPath = __dirname+"/container1";
var escapePath = __dirname;
var containerId = "container1";
var fs = require('fs');
var async = require('async');
var rimraf = require('rimraf');

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
    fs.mkdirSync(escapePath);
    cb();
  }

  Lab.test('try to escape with ../', function (done) {
    done(new Error('todo'));
  });
  Lab.test('take middleware out of resf-fs move to index', function (done) {
    done(new Error('todo'));
  });
});

  