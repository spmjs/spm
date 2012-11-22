var async = require('async');

describe("async module ", function() {
  describe('queue test', function() {
    it('get queue length', function(done) {
      var queue = async.queue(function(name, callback) {
        callback();
      }, 1);

      setTimeout(function() {
        done();
      }, 400);

      queue.tasks.should.have.length(0);
      queue.push('one');
      queue.tasks.should.have.length(1);

      setTimeout(function(){
        queue.push('two');
        queue.tasks.push({data: 1})
        queue.tasks.unshift({data: 2})
        queue.tasks.should.have.length(3);
      }, 100);

      setTimeout(function(){
        queue.push('three');
        queue.tasks.should.have.length(1);
      }, 200);
      
      setTimeout(function(){
        queue.push('four');
        queue.tasks.should.have.length(1);
      }, 300);
    });
  });
});
