var should = require('should');
var path = require('path');

var spm = require('../../lib/spm.js'); // require('spm');
var fsExt = require('../../lib/utils/fs_ext.js');
var isCoffee = require('../../lib/utils/module_help.js').isCoffee;
var depUtil = require('../../lib/utils/dependences.js');
var Opts = require('../../lib/utils/commander.js');

var build = spm.getAction('build');

require('../module.js');

describe('coffee plugin test', function() {
  var action = "build";
  var opts = Opts.get(action);
  var dir = path.join(path.dirname(module.filename), "../data/modules/coffeeModule/");
  var dir2 = path.join(path.dirname(module.filename), "../data/modules/coffeeModule2/");
 
  var coffeePlugin = require('../../lib/plugins/coffee.js');
  var resources = require('../../lib/plugins/resources.js');
  var clean = require('../../lib/plugins/clean.js');

  coffeePlugin.setOpts(opts);
  resources.setOpts(opts);
  clean.setOpts(opts);

  describe('coffee plugin', function() {
      
    beforeEach(function(done) {
      getProjectModel(dir, function(model) {
        resources.execute(model, function() {
          done();
        });
      });
    });

    it('test compile', function(done) {
      getProjectModel(dir, function(model) {
        var src = model.srcDirectory;
        var build = model.buildDirectory;

        coffeePlugin.execute(model, function() {
          var scripts1 = fsExt.listFiles(src);
          var scripts2 = fsExt.listFiles(build);
          console.log('-------', scripts1, scripts2);
          scripts1.length.should.eql(scripts2.length);

          var srcScripts = fsExt.listFiles(src, /coffee$/);
          var buildScripts = fsExt.listFiles(build, /coffee\.js$/);

          srcScripts.should.have.length(1);
          buildScripts.should.have.length(1);

          var srcCode = fsExt.listFiles(src, /js$/).map(function(f) {
            return fsExt.readFileSync(f);
          });

          var buildCode = fsExt.listFiles(build, /js$/).map(function(f) {
            return fsExt.readFileSync(f);
          });
          
          var srcModDeps = depUtil.parse(srcCode[0]);
          var hasCoffee = srcModDeps.some(function(dep) {
            return isCoffee(dep);
          });

          hasCoffee.should.be.true;

          var buildModDeps = depUtil.parse(buildCode[0]);
          var buildHasCoffee = buildModDeps.some(function(dep) {
            return isCoffee(dep);
          });

          buildHasCoffee.should.be.false;

          clean.execute(model, function() {
            done();
          });
        });
      });
    });
  });

  describe('coffee project build', function() {
    it('coffee module success build', function(done) {
      build.run({base: dir2}, function() {

        var code = fsExt.readFileSync(dir2, 'dist/Commons.coffee-debug.js');
        code.should.include('define("test/coffee-module2/1.0.0/SubModule_A.coffee-debug"');
        code.should.include('define("test/coffee-module2/1.0.0/SubModule_B.coffee-debug"');
        code.should.include('define("test/coffee-module2/1.0.0/Commons.coffee-debug"');

        var code2 = fsExt.readFileSync(dir2, 'dist/SubModule_A.coffee-debug.js');
        code2.should.include('define("test/coffee-module2/1.0.0/SubModule_A.coffee-debug"');
        done();
      });    
    });
  });
});
