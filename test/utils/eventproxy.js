var EventProxy = require('../../lib/utils/event_proxy.js');
var _ = require('underscore');

describe('eventproxy', function() {
  it('test mulit event emit', function(done) {
    var obj = {};
    
    var ep = EventProxy.create('e1', 'e2', 'e3', function(data) {
      done();
      _.keys(obj).should.have.length(3);
      data['e1'].should.eql('a');
      data['e2'].should.eql('b');
      data['e3'].should.eql('c');
      data['e5'].should.eql('e');
      console.info('all done', data);
    });


    setTimeout(function() {
      obj.name = 1;
      ep.emit('e1', "a");
    }, 100);

    setTimeout(function() {
      obj.age = 2;
      ep.emit('e2', "b");
      ep.add('e5');
      setTimeout(function() {
        ep.emit('e5', 'e'); 
      }, 500);
    }, 200);

    setTimeout(function() {
      obj.sex = 3;
      ep.emit('e3', "c");
    }, 300);
    
  });
});
