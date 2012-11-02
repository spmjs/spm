var path = require('path');
var fsExt = require('../../lib/utils/fs_ext.js');

var spm = require('../../lib/spm.js'); // require('spm');
var depsPlugin = require('../../lib/plugins/dependencies.js');
var build = spm.getAction('build');

var moduleAdir = path.join(path.dirname(module.filename), "../data/modules/moduleA/");
var invalidNameModuleDir = path.join(path.dirname(module.filename), "../data/modules/invalidName/");
var noDepsConfigModuleDir = path.join(path.dirname(module.filename), "../data/modules/noDepsConfig/");
var relativeModuleDir = path.join(path.dirname(module.filename), "../data/modules/relativeModule/");
var sampleModuleDir = path.join(path.dirname(module.filename), "../data/modules/sampleModule/");

describe('spm build test', function() {

  it('module model create test', function() {
    getProjectModel(moduleAdir, function(moduleA) {
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

        var deps = depsPlugin.parseDependencies(null, moduleDebugCode);
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
        expect(model.name).toEqual('relativeModule');
        var moduleCPath = path.join(relativeModuleDir, 'dist', 'lib', 'c-debug.js');
        expect(fsExt.existsSync(moduleCPath)).toBeTruthy();
        
        var code = fsExt.readFileSync(moduleCPath);

        var cDefReg = /define\("relativeModule\/0.9.1\/lib\/c-debug", \["..\/core\/a-debug", "..\/core\/b-debug"\]/;
        var bDefReg = /define\("relativeModule\/0.9.1\/core\/b-debug", \[\]/;
        var aDefReg = /define\("relativeModule\/0.9.1\/core\/a-debug", \[".\/b-debug"\]/;
        expect(code).toMatch(cDefReg);
        expect(code).toMatch(bDefReg);
        expect(code).toMatch(aDefReg);
        buildOver = true;
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
        buildOver = true;
      });
    });

    waitsFor(function() {
      return buildOver;
    });
  });

  it('test module require', function() {
    var buildOver = false;
    runs(function() {
      executeBuildAction(sampleModuleDir, function(model) {
        var modulePath = path.join(sampleModuleDir, 'dist', 'debugRequire-debug.js');
        expect(fsExt.existsSync(modulePath)).toBeTruthy();
        
        var code = fsExt.readFileSync(modulePath);

        var defineReg = /define\("sampleModule\/0.0.1\/debugRequire-debug", \[".\/module-debug"\]/;
        var requireReg1 = /require\('\.\/module-debug'\)/;
        var requireReg2 = /require\('module-debug'\)/;
        expect(code).toMatch(defineReg);
        expect(code).toMatch(requireReg1);
        expect(code).toMatch(requireReg2);
        buildOver = true;
      });
    });

    waitsFor(function() {
      return buildOver;
    });
  });

  it('test require async', function() {
    var buildOver = false;
    runs(function() {
      executeBuildAction(sampleModuleDir, function(model) {
        var modulePath = path.join(sampleModuleDir, 'dist', 'asyncRequire-debug.js');
        expect(fsExt.existsSync(modulePath)).toBeTruthy();
        
        var code = fsExt.readFileSync(modulePath);

        var defineReg = /define\("sampleModule\/0.0.1\/asyncRequire-debug", \[\]/;
        var requireReg1 = /require\.async\('\.\/module-debug'\)/;
        var requireReg2 = /require\.async\('module-debug'\)/;
        var requireReg2 = /require\.async\('$-debug'\)/;
        var requireReg2 = /require\.async\('#base\/1.0.0\/base-debug'\)/;
        expect(code).toMatch(defineReg);
        expect(code).toMatch(requireReg1);
        expect(code).toMatch(requireReg2);
        buildOver = true;
      });
    });

    waitsFor(function() {
      return buildOver;
    });
  });

});

function executeBuildAction(moduleDir, callback) {
  build.run({
    base: moduleDir
  }, callback);
}

