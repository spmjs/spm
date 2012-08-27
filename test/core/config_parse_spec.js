var async = require('async');
var path = require('path');
var Config = require('../../lib/core/config_parse.js');

describe("config parse test", function() {
  it('test async queue', function() {
    var isOver = false;
    var queue = async.queue(function(name, callback) {
      isOver = false;
      callback();
    }, 1);

    setTimeout(function() {
      isOver = true;
    }, 400);

    expect(queue.tasks.length).toBe(0);
    queue.push('one');
    expect(queue.tasks.length).toBe(1);
    runs(function() {
      setTimeout(function(){
        queue.push('two');
        queue.tasks.push({data: 1})
        queue.tasks.unshift({data: 2})
        expect(queue.tasks.length).toBe(3);
      }, 100);

      setTimeout(function(){
        queue.push('three');
        expect(queue.tasks.length).toBe(1);
      }, 200);
      
      setTimeout(function(){
        queue.push('four');
        expect(queue.tasks.length).toBe(1);
      }, 300);
    });

    waitsFor(function() {
      return isOver;
    });
  });

  it('test Config create', function() {
    var config = new Config();
    expect(Object.keys(config._obj).length).toBe(0);
    expect(Object.keys(config._parseRule).length).toBe(0);
    expect(config._state).toBe('end');
  });

  it('test local config read', function() {
    var config = new Config();
    var json = path.join(path.dirname(module.filename), "../data/core/config_parse/config.json");
    
    console.info('----1-->', config._state);
    config.addFile(json);
    console.info('----2-->', config._state, config.get('name'));

    runs(function() {
    });

    waitsFor(function() {
     
    }, 1000);

    console.info('----->', config._state);
  });
});
