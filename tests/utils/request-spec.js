var request = require('request');

describe('request test', function() {

  it("request get test", function(done) {
    
    request.get('http://baidu.com').on('error', function() {
        // console.log('request error');
    }).on('close', function() {
      console.log('request close');
    })

    request('http://modules.seajs.org/async/0.1.22/async.js', function(req, res, b) {
      done();
    });
  });
});

