var should = require('should');
var async = require('async');
var path = require('path');
var _ = require('underscore');
var Config = require('../../lib/utils/config_parse.js');

describe("config parse test", function() {
  var json1 = path.join(path.dirname(module.filename), "../data/configs/config_1.json");
  var json2 = path.join(path.dirname(module.filename), "../data/configs/config_2.json");
  var json3 = path.join(path.dirname(module.filename), "../data/configs/config_3.json");
  var p_config = path.join(path.dirname(module.filename), "../data/configs/parent_config.json");
  var spm_config = path.join(path.dirname(module.filename), "../data/configs/spm_config.json");
  var spm_config1 = path.join(path.dirname(module.filename), "../data/configs/spm_config1.json");
  var spm_config2 = path.join(path.dirname(module.filename), "../data/configs/spm_config2.json");
  var seajs_config = path.join(path.dirname(module.filename), "../data/configs/seajs.config");

  var serverConfig1 = "http://modules.spmjs.org/config.json";
  var serverConfig2 = "http://modules.seajs.org/config.json";

  var config;
  
  beforeEach(function() {
    config = new Config();
    config.addFile(json1);
  });

  afterEach(function() {
    config = null; 
  });

  
  it('test Config create', function() {
    var config = new Config();
    Object.keys(config._obj).should.have.length(0);
    Object.keys(config._parseRule).should.have.length(0);
    config._state.should.eql('end');
  });

  describe('add local file and url', function() {
    it('test local and url config read', function(done) {
      config.on('end', function(config) {
        // test parse end
        config.get('sources').should.have.length(2);
        Object.keys(config._obj).length.should.be.above(1);
      });

      config.addFile(json2);
      config.addUrl(serverConfig1);

      config.on('end', function() {
        config.get('name').should.eql('module');
        config.get('version').should.eql('0.0.1');

        // test array merge
        var sources = config.get('sources');

        sources.should.have.length(2);
        sources[0].should.eql('arale.alipay.im:8001');
        sources[1].should.eql('arale.alipay.im:8000');
        //sources[2].should.eql('http://modules.spmjs.org');

        // test object merge
        var dependencies = config.get('dependencies');
        dependencies['widget'].should.eql('1.0.0');

        // test extend
        config.get('extend').should.be.true;

        // test boolean value merge
        config.get('isBoolean').should.be.false;


        // load new config

        /** TODO emit once
        config.addUrl(serverConfig2);

        config.on('end', function() {
    console.info('-------------------------2');
          sources = config.get('sources');
          sources.should.have.length(3);
          sources[0].should.eql('arale.alipay.im:8001');
          sources[1].should.eql('arale.alipay.im:8000');
          sources[2].should.eql('http://modules.seajs.org');
        });
        **/
        done();
      });
    });
  });

  describe('seajs config read', function() {
    it('test read alias', function(done) {
      config.addFile(json2);
      config.addFile(seajs_config);

      config.on('end', function() {
        should.not.exist(config.get('alias'));
        config.get('dependencies')['_'].should.eql('underscore/1.0.0/underscore');
        done();
      });
    });
  });

  describe('parse parent', function() {
    it('read dependencies', function() {
      config.addParseRule('parent', function(value, filepath) {
         var parentPath = path.join(path.dirname(filepath), value);
         this.addFile(parentPath, null, true);
      });

      config.addFile(json2);
      config.addFile(json3);

      config.on('end', function() {
        var dependencies = config.get('dependencies');
        dependencies['$'].should.eql('jquery/1.7.2/jquery');
        config.get('root').should.eql('alipay');
        config.get('sources')[3].should.eql('arale.alipay.im:8003');
      });
    });
  });

  describe('parse spm config', function() {

    it('read to value is to', function() {
      config.addFile(spm_config);
      config.addFile(spm_config1);
      config.addFile(spm_config2);

      config.on('end', function() {
        var spmConfig = config.get('spmConfig');
        var upload = spmConfig.upload;
        var build = spmConfig.build;
        upload.override.should.be.false;
        upload.to.should.eql('to');
        upload.src.should.eql('src1');
        upload.dest.should.eql('dest2');

        build.to.should.eql('to11');
      });
    });

    it('read server spmconfig', function(done) {
      should.not.exists(config.get('spmConfig'));
      config.addFile(spm_config);
      config.addFile(spm_config1);
      config.addFile(spm_config2);
      
      config.addUrl(serverConfig1);

      config.on('end', function() {
        var spmConfig = config.get('spmConfig');
        should.exists(spmConfig);

        var upload = spmConfig.upload;
        upload.roots.should.eql(["arale", "gallery", "spm"]);
        done();
      })
    });
  
  });

  describe('async get', function() {
    it('expect parsing state', function() {
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

  describe('object merge test', function() {
    var o1 = {
      "sources": ["http://modules.seajs.org"],
      "spmConfig": {
         "build": {
           "moduleBase1": "https://a.alipayobjects.com/static2",
           "plugins": {
             "build": {
               "val": ["v1"],
               "key": ["k1"],
               "flag": false,
               "after": "spm/release-check/1.0.0/check"
             }
           }
         }
      }
    };  

    var o2 = {
      "sources": ["http://modules.seajs.org"],
      "spmConfig": {
        "build": {
          "moduleBase2": "https://a.alipayobjects.com/static1",
          "plugins": {
            "build": {
              "val": ["v2"],
              "key": "k2",
              "before": "spm/release-check/1.0.0/before",
              "flag": true
            }
          }
        }
      }
    };

    Config.merge(o1, o2);

    o1.spmConfig.build.moduleBase1.should.eql("https://a.alipayobjects.com/static2");
    o1.spmConfig.build.moduleBase2.should.eql("https://a.alipayobjects.com/static1");

    should.exists(o1.spmConfig.build.plugins.build.after);
    should.exists(o1.spmConfig.build.plugins.build.before);

    o1.spmConfig.build.plugins.build.val.should.have.length(2);
    o1.spmConfig.build.plugins.build.key.should.have.length(2);

    o1.spmConfig.build.plugins.build.flag.should.be.false;

    should.not.exists(o2.spmConfig.build.plugins.build.after);
    should.not.exists(o2.spmConfig.build.moduleBase1);

    o2.spmConfig.build.plugins.build.val.should.have.length(1);
    o2.spmConfig.build.plugins.build.key.should.eql("k2");

    o2.spmConfig.build.plugins.build.flag.should.be.true;
  });

});
