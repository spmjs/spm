/**
var EventProxy = require('eventproxy');
var _ = require('underscore');

describe('eventproxy', function() {
  it('test mulit event emit', function(done) {
    var obj = {};
    
    var ep = EventProxy.create('e1', 'e2', 'e3', function() {
      done();
      _.keys(obj).should.have.length(3);
      console.info('all done', arguments);
    });


    setTimeout(function() {
      obj.name = 1;
      ep.emit('e1', "a");
    }, 100);

    setTimeout(function() {
      obj.age = 2;
      ep.emit('e2', "b");
      ep._callbacks.e4 = [null];
    }, 200);

    setTimeout(function() {
      obj.sex = 3;
      ep.emit('e3', "c");
      console.info('=====>', ep._callbacks.all)
    }, 300);
    
  });
});
**/
