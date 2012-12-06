var should = require('should');
var path = require('path');
var fsExt = require('../../lib/utils/fs_ext.js');
var Opts = require('../../lib/utils/opts.js');
require('../module.js');

describe('coffee plugin test', function() {
  var action = "build";
  var opts = Opts.get(action);
  var dir = path.join(path.dirname(module.filename), "../data/modules/coffeeModule/");
 
  var coffeePlugin = require('../../lib/plugins/coffee.js');
  var resources = require('../../lib/plugins/resources.js');
  var clean = require('../../lib/plugins/clean.js');

  coffeePlugin.setOpts(opts);
  resources.setOpts(opts);
  clean.setOpts(opts);

  beforeEach(function() {
    getProjectModel(dir, function(model) {
      resources.execute(model, function() {
      });
    });
  });

  it('test coffee plugin', function(done) {
    getProjectModel(dir, function(model) {
      var src = model.srcDirectory;
      var build = model.buildDirectory;

      coffeePlugin.execute(model, function() {
        var scripts1 = fsExt.listFiles(src);
        var scripts2 = fsExt.listFiles(build);
console.info('-------', scripts1, scripts2);
        scripts1.length.should.eql(scripts2.length);

        var srcScripts = fsExt.listFiles(src, /coffee$/);
        var buildScripts = fsExt.listFiles(build, /coffee\.js$/);

        srcScripts.should.have.length(1);
        buildScripts.should.have.length(1);

        var coffeeModPattern = model.getReqModRegByType('[^\"\']+\\.coffee');

        var srcCode = fsExt.listFiles(src, /js$/).map(function(f) {
          return fsExt.readFileSync(f);
        });

        var buildCode = fsExt.listFiles(build, /js$/).map(function(f) {
          return fsExt.readFileSync(f);
        });
        
        coffeeModPattern.test(srcCode[0]).should.be.true;
        coffeeModPattern.test(buildCode[0]).should.be.false;
      });

      clean.execute(model, function() {
      });
      done();
    });
  });
});
