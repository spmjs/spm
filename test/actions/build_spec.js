var path = require('path');
var moduleHelp = require('../../lib/utils/moduleHelp.js');
var fsExt = require('../../lib/utils/fs_ext.js');

var ACTION = 'build';
var buildAction = require('../../lib/actions/build.js');
var invalidNameModuleDir = path.join(path.dirname(module.filename), "../data/modules/invalidName/");
var noDepsConfigModuleDir = path.join(path.dirname(module.filename), "../data/modules/noDepsConfig/");


describe('spm build test', function() {

  var depsPlugin = require('../../lib/plugins/dependencies.js');

  it('test unDepsConfig module build', function() {
    var buildOver = false;
    runs(function() {
      getProjectModel(ACTION, noDepsConfigModuleDir, function(model) {
        buildAction.execute(ACTION, model, function(err) {
          expect(err).toBeFalsy();
          var distCodePath = path.join(model.distDirectory, 'module-debug.js');
          var moduleDebugCode = fsExt.readFileSync(distCodePath);
          expect(moduleDebugCode).toBeDefined();
          var deps = depsPlugin.parseDependencies(moduleDebugCode);
          deps.forEach(function(dep) {
            expect(/undefined/.test(dep)).toBeFalsy();
          });
          console.info(deps)
          buildOver = true;
        });
      });
    });

    waitsFor(function() {
      return buildOver;
    });
  
  });

  it('test relative module build ', function() {
    var buildOver = false;
    runs(function() {
      getProjectModel(ACTION, invalidNameModuleDir, function(model) {
        buildAction.execute(ACTION, model, function(err) {
          expect(err).toBeFalsy();
          var distCodePath = path.join(model.distDirectory, 'jquery.json-2.s-debug.js');
          var moduleDebugCode = fsExt.readFileSync(distCodePath);
          expect(moduleDebugCode).toBeDefined();
          expect(model.getModuleId('jquery.json-2.s.js')).toEqual('invalidNameModule/0.0.1/jquery.json-2.s');
          var defineReg = /define\("invalidNameModule\/0\.0\.1\/jquery\.json-2\.s-debug/;
          expect(defineReg.test(moduleDebugCode)).toBeTruthy();
          buildOver = true;
        });
      });
    });

    waitsFor(function() {
      return buildOver;
    });
  });

});

