require('should');
var publish = require('../lib/publish');
var http = require('http');
var server;
var port = 12345;

describe('spm publish', function() {

  beforeEach(function() {
    server && server.close();
    server = null;
  });

  afterEach(function() {
    server && server.close();
    server = null;
  });

  it('publish success', function(done) {
    server = http.createServer(function(req, res) {
      req.headers['content-type'].should.eql('application/json');
      req.headers['accept-encoding'].should.eql('gzip');
      req.url.should.be.eql('/repository/arale-base/1.0.0/');
      req.method.should.be.eql('POST');
      res.writeHead(200);
      var data = {
        'urlpath': 'xxx',
        'status': 200
      };
      res.end(JSON.stringify(data));
    }).listen(port, function() {
      publish.publish({
        server: 'http://127.0.0.1:' + port
      }, {
        name: 'arale-base',
        version: '1.0.0'
      }, function() {
        done();
      });
    });
  });

});

