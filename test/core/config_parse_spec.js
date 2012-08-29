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

  var json1 = path.join(path.dirname(module.filename), "../data/configs/config_1.json");
  var json2 = path.join(path.dirname(module.filename), "../data/configs/config_2.json");
  var json3 = path.join(path.dirname(module.filename), "../data/configs/config_3.json");
  var p_config = path.join(path.dirname(module.filename), "../data/configs/parent_config.json");
  var spm_config = path.join(path.dirname(module.filename), "../data/configs/spm_config.json");
  var seajs_config = path.join(path.dirname(module.filename), "../data/configs/seajs.config");

  var config;
  
  beforeEach(function() {
    config = new Config();
    config.addFile(json1);
  });

  afterEach(function() {
    config = null; 
  });

  it('test local and url config read', function() {
    config.on('end', function(config) {
      // test parse end
      expect(config.get('sources').length).toEqual(3);
      expect(Object.keys(config._obj).length).toBeGreaterThan(0);
    });

    runs(function() {
      config.addFile(json2);
      config.addUrl('http://modules.seajs.org/config.json');
    });

    waitsFor(function() {
      return config._state === 'end'; 
    }, 19000);

    runs(function() {
      expect(config.get('name')).toBe('module');
      expect(config.get('version')).toBe('0.0.1');

      // test array merge
      var sources = config.get('sources');
      expect(sources.length).toBe(3);
      expect(sources[0]).toBe('arale.alipay.im:8001');
      expect(sources[1]).toBe('arale.alipay.im:8000');
      expect(sources[2]).toBe('http://modules.aralejs.org');

      // test object merge
      var dependencies = config.get('dependencies');
      expect(dependencies['widget']).toBe('1.0.0');

      // test extend
      expect(config.get('extend')).toBe(true);

      // test boolean value merge
      expect(config.get('isBoolean')).toBeFalsy();
    });
  });

  it('test read seajs config', function() {
    runs(function() {
      config.addFile(json2);
      config.addFile(seajs_config);
    });

    waitsFor(function() {
      return config.isEnd();
    }, 100);

    runs(function() {
      expect(config.get('alias')).toBeUndefined();
      expect(config.get('dependencies')['_']).toEqual('underscore/1.0.0/underscore');
    });
  });

  it('test read parent', function() {
    config.addParseRule('parent', function(value, filepath) {
       var parentPath = path.join(path.dirname(filepath), value);
       this.addFile(parentPath, null, true);
    });

    runs(function() {
      config.addFile(json2);
      config.addFile(json3);
    }); 

    waitsFor(function() {
      return config.isEnd();
    }, 100);

    runs(function() {
      var dependencies = config.get('dependencies');
      expect(dependencies['$']).toBe('jquery/1.7.2/jquery');
      expect(config.get('root')).toBe('alipay');
      expect(config.get('sources')[3]).toBe('arale.alipay.im:8003');
    });
  });

  it('test async get', function() {
    runs(function() {
      config.addFile(json2);
    });

    var p = null;
    runs(function() {
      var fn = function() {
        config.get('parent');
      };
      expect(fn).toThrow();

      config.get('parent', function(value) {
        p = value; 
      });
    });
    expect(config.state()).toEqual('parsing');
    
    waitsFor(function() {
      return config.isEnd();
    }, 500);

    runs(function() {
      expect(p).toEqual('parent_config.json');
    });
  });
});
