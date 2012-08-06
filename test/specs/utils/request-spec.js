var request = require('request');

describe('request test', function() {

  it("request get test", function() {
    runs(function() {
    
      request.get('http://baidu.com').on('error', function() {
          // console.log('request error');
      }).on('close', function() {
        console.log('request close');
      })
    }); 

    var body = null;

    runs(function() {
      request('https://raw.github.com/seajs/modules/gh-pages/async/0.1.15/async-debug.js', function(req, res, b) {
        body = b; 
        // console.log(1111111, body)    
      });
    })

    waitsFor(function() {return body}, 'wait request ', 5000);

    runs(function() {
      expect(body).not.toBe(null);
    });
  });
});

