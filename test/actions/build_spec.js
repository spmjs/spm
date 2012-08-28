var path = require('path');
var fsExt = require('../../lib/utils/fs_ext.js');
var ActionFactory = require('../../lib/core/action_factory.js');
var depsPlugin = require('../../lib/plugins/dependencies.js');

var action = 'build';
var buildAction = ActionFactory.getActionObj(action); 

var moduleAdir = path.join(path.dirname(module.filename), "../data/modules/moduleA/");
var invalidNameModuleDir = path.join(path.dirname(module.filename), "../data/modules/invalidName/");
var noDepsConfigModuleDir = path.join(path.dirname(module.filename), "../data/modules/noDepsConfig/");
var relativeModuleDir = path.join(path.dirname(module.filename), "../data/modules/relativeModule/");
var sampleModuleDir = path.join(path.dirname(module.filename), "../data/modules/sampleModule/");

describe('spm build test', function() {

  it('module model create test', function() {
    getProjectModel(action, moduleAdir, function(moduleA) {
      expect(moduleA).not.toBe(null);
      expect(moduleA.name).toEqual('moduleA');
      expect(moduleA.version).toEqual('0.9.17');
    });
  });

  it('test unDepsConfig module build', function() {
    var buildOver = false;
    runs(function() {
      executeBuildAction(noDepsConfigModuleDir, function(model) {
        var distCodePath = path.join(model.distDirectory, 'module-debug.js');
        var moduleDebugCode = fsExt.readFileSync(distCodePath);

        expect(moduleDebugCode).toBeDefined();

        var deps = depsPlugin.parseDependencies(moduleDebugCode);
        deps.forEach(function(dep) {
          expect(/undefined/.test(dep)).toBeFalsy();
        });
        buildOver = true;
      });
    });

    waitsFor(function() {
      return buildOver;
    });
  
  });

  it('test invalidName module build ', function() {
    var buildOver = false;
    runs(function() {
      executeBuildAction(invalidNameModuleDir, function(model) {
        var distCodePath = path.join(model.distDirectory, 'jquery.json-2.s-debug.js');
        var moduleDebugCode = fsExt.readFileSync(distCodePath);
        expect(moduleDebugCode).toBeDefined();
        expect(model.getModuleId('jquery.json-2.s.js')).toEqual('invalidNameModule/0.0.1/jquery.json-2.s');
        var defineReg = /define\("invalidNameModule\/0\.0\.1\/jquery\.json-2\.s-debug/;
        expect(defineReg.test(moduleDebugCode)).toBeTruthy();
        buildOver = true;
      });
    });

    waitsFor(function() {
      return buildOver;
    });
  });

  it('test relative module build ', function() {
    var buildOver = false;
    runs(function() {
      executeBuildAction(relativeModuleDir, function(model) {
        buildOver = true;
        expect(model.name).toEqual('relativeModule');
        var moduleCPath = path.join(relativeModuleDir, 'dist', 'lib', 'c-debug.js');
        expect(fsExt.existsSync(moduleCPath)).toBeTruthy();
        
        var code = fsExt.readFileSync(moduleCPath);

        var cDefReg = /define\("relativeModule\/0.9.1\/lib\/c-debug", \["..\/core\/b-debug", "..\/core\/a-debug"\]/;
        expect(code).toMatch(cDefReg);
      });
    });

    waitsFor(function() {
      return buildOver;
    });
  });

  it('test module which define contain space', function() {
    var buildOver = false;
    runs(function() {
      executeBuildAction(sampleModuleDir, function(model) {
        buildOver = true;
        expect(model.name).toEqual('sampleModule');
        var spaceDefinePath = path.join(sampleModuleDir, 'dist', 'spaceDefine-debug.js');
        var modulePath = path.join(sampleModuleDir, 'dist', 'module-debug.js');
        expect(fsExt.existsSync(spaceDefinePath)).toBeTruthy();
        expect(fsExt.existsSync(modulePath)).toBeTruthy();
        var code = fsExt.readFileSync(spaceDefinePath);
        var moduleCode = fsExt.readFileSync(modulePath);
        var sreg = /define\("sampleModule\/0.0.1\/spaceDefine-debug",/;
        var mreg = /define\("sampleModule\/0.0.1\/module-debug",/;
        expect(code).toMatch(sreg);
        expect(moduleCode).toMatch(mreg);
      });
    });

    waitsFor(function() {
      return buildOver;
    });
  });
});

function executeBuildAction(moduleDir, callback) {
  getProjectModel(action, moduleDir, function(model) {
    buildAction.execute(model, function(err) {
      expect(err).toBeFalsy();
      callback(model);
    });
  });
}

