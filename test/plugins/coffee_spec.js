var path = require('path');
var fsExt = require('../../lib/utils/fs_ext.js');
var Opts = require('../../lib/utils/opts.js');

describe('coffee plugin test', function() {
  var action = "build";
  var argv = Opts.get(action).argv;
  var dir = path.join(path.dirname(module.filename), "../data/modules/coffeeModule/");
 
  var coffeePlugin = require('../../lib/plugins/coffee.js');
  var resources = require('../../lib/plugins/resources.js');
  var clean = require('../../lib/plugins/clean.js');

  beforeEach(function() {
    getProjectModel(action, dir, function(model) {
      resources.execute(model, argv, function() {
      });
    });
  });

  afterEach(function() {
    getProjectModel(action, dir, function(model) {
      clean.execute(model, argv, function() {
      });
    });
  });

  it('test coffee plugin', function() {
    getProjectModel(action, dir, function(model) {
      var src = model.srcDirectory;
      var build = model.buildDirectory;

      coffeePlugin.execute(model, argv, function() {
        var scripts1 = fsExt.listFiles(src);
        var scripts2 = fsExt.listFiles(build);
        expect(scripts1.length).toEqual(scripts2.length);

        var srcScripts = fsExt.listFiles(src, /coffee$/);
        var buildScripts = fsExt.listFiles(build, /coffee\.js$/);
        expect(srcScripts.length).toEqual(1);
        expect(buildScripts.length).toEqual(1);

        var coffeeModPattern = model.getReqModRegByType('[^\"\']+\\.coffee');

        var srcCode = fsExt.listFiles(src, /js$/).map(function(f) {
          return fsExt.readFileSync(f);
        });

        var buildCode = fsExt.listFiles(build, /js$/).map(function(f) {
          return fsExt.readFileSync(f);
        });
        
        expect(coffeeModPattern.test(srcCode[0])).toBeTruthy();
        expect(coffeeModPattern.test(buildCode[0])).toBeFalsy();
      });
    });
  });
});
