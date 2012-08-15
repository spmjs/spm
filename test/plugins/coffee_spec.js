var path = require('path');
var ProjectFactory = require('../../../lib/actions/build/core/project_factory.js');
var fsExt = require('../../../lib/utils/fs_ext.js');

describe('project model constructor', function() {
  var action = "build";
  var dir = path.join(path.dirname(module.filename), "./datas/coffeeModule/");
  console.log(dir);
  it('test model create ', function() {
    getProjectModel('build', dir, function(moduleA) {
      expect(moduleA).not.toBe(null);
      expect(moduleA.name).toEqual('coffeeModule');
      expect(moduleA.version).toEqual('0.9.1');
    });
  });

  var coffeePlugin = require('../../../lib/actions/build/plugins/coffee.js');
  var resources = require('../../../lib/actions/build/plugins/resources.js');
  var clean = require('../../../lib/actions/build/plugins/clean.js');

  beforeEach(function() {
     
    getProjectModel('build', dir, function(model) {
      resources.execute(model, function() {
      });
    });
  });

  afterEach(function() {
    getProjectModel('build', dir, function(model) {
      clean.execute(model, function() {
      });
    });
  });

  it('test coffee plugin', function() {
    getProjectModel('build', dir, function(model) {
      var src = model.srcDirectory;
      var build = model.buildDirectory;

      coffeePlugin.execute(model, function() {
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

function getProjectModel(action, dir, callback) {
  ProjectFactory.getProjectModel(action, dir, function(projectModel) {
    callback(projectModel);
  });
}
