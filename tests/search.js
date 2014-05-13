require('should');
var search = require('../lib/search');
var http = require('http');
var server;
var port = 12345;

describe('spm search', function() {

  beforeEach(function() {
    server && server.close();
    server = null;
  });

  afterEach(function() {
    server && server.close();
    server = null;
  });

  it('search query', function(done) {
    server = http.createServer(function(req, res) {
      req.url.should.be.eql('/repository/search?q=arale');
      req.method.should.be.eql('GET');
      res.writeHead(200);
      var data = {
        'data': {
          total: 0,
          results: []
        }
      };
      res.end(JSON.stringify(data));
    }).listen(port, function() {
      search({
        server: 'http://127.0.0.1:' + port,
        query: 'arale'
      }, function() {
        done();
      });
    });
  });

});
