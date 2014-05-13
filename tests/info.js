require('should');
var info = require('../lib/info');
var http = require('http');
var server;
var port = 17173;

describe('spm info', function() {

  beforeEach(function() {
    server && server.close();
    server = null;
  });

  afterEach(function() {
    server && server.close();
    server = null;
  });

  it('module with version', function(done) {
    server = http.createServer(function(req, res) {
      req.url.should.be.eql('/repository/arale-base/1.0.0/');
      req.method.should.be.eql('GET');
      res.writeHead(200);
      res.end('[]');
    }).listen(port, function() {
      info({
        query: 'arale-base@1.0.0',
        server: 'http://127.0.0.1:' + port
      });
      done();
    });
  });
  it('module stable', function(done) {
    server = http.createServer(function(req, res) {
      req.url.should.be.eql('/repository/arale-base/');
      res.writeHead(200);
      res.end('[{"name": "module-name-for-test"}]');
    }).listen(port, function() {
      info({
        query: 'arale-base',
        server: 'http://127.0.0.1:' + port
      });
      done();
    });
  });
});
