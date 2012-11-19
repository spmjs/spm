var should = require('should');
var async = require('async');
var path = require('path');
var Config = require('../../lib/core/config_parse.js');

describe("config parse test", function() {
  it('test async queue', function(done) {
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

  it('test Config create', function() {
    var config = new Config();
    Object.keys(config._obj).should.have.length(0);
    Object.keys(config._parseRule).should.have.length(0);
    config._state.should.eql('end');
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

  it('test local and url config read', function(done) {
    config.on('end', function(config) {
      // test parse end

      config.get('sources').should.have.length(3);
      Object.keys(config._obj).length.should.be.above(0);
    });

    config.addFile(json2);
    config.addUrl('http://modules.seajs.org/config.json');

    setTimeout(function() {
      config.get('name').should.eql('module');
      config.get('version').should.eql('0.0.1');

      // test array merge
      var sources = config.get('sources');
      sources.should.have.length(3);
      sources[0].should.eql('arale.alipay.im:8001');
      sources[1].should.eql('arale.alipay.im:8000');
      sources[2].should.eql('http://modules.seajs.org');

      // test object merge
      var dependencies = config.get('dependencies');
      dependencies['widget'].should.eql('1.0.0');

      // test extend
      config.get('extend').should.be.true;

      // test boolean value merge
      config.get('isBoolean').should.be.false;
      done();
    }, 3000);
  });

  it('test read seajs config', function(done) {
    config.addFile(json2);
    config.addFile(seajs_config);

    setTimeout(function() {
      should.not.exist(config.get('alias'));
      config.get('dependencies')['_'].should.eql('underscore/1.0.0/underscore');
      done();
    }, 100);
  });

  it('test read parent', function() {
    config.addParseRule('parent', function(value, filepath) {
       var parentPath = path.join(path.dirname(filepath), value);
       this.addFile(parentPath, null, true);
    });

    config.addFile(json2);
    config.addFile(json3);

    setTimeout(function(){
      var dependencies = config.get('dependencies');
      dependencies['$'].should.eql('jquery/1.7.2/jquery');
      config.get('root').should.eql('alipay');
      config.get('sources')[3].should.eql('arale.alipay.im:8003');
    }, 100);
  });

  it('test async get', function() {
    config.addFile(json2);

    var p = null;
    var fn = function() {
      config.get('parent');
    };

    fn.should.throw();

    config.get('parent', function(value) {
      p = value; 
    });

    config.state().should.eql('parsing');
    
    setTimeout(function() {
      p.should.eql('parent_config.json');
    }, 500);
  });
});
