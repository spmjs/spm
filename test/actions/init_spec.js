require('shelljs/global');
var path = require('path');

var spm = require('../../lib/spm.js'); // require('spm');
var fsExt = require('../../lib/utils/fs_ext.js');
var init = spm.getAction('init');

var moduleDir = path.join(path.dirname(module.filename), '../data/init_modules/');
describe('spm init action', function() {
  beforeEach(function() {
    rm('-rf', path.join(moduleDir, '*'));
  });

  afterEach(function() {
    rm('-rf', path.join(moduleDir, '*'));
  });
  
  it('test init empty project by default', function() {
    var initSucc = false
    var moduleName = 'testModule';
    runs(function() {
      init.run({projectName: moduleName, base: path.join(moduleDir, moduleName), 'module-type': "name=base"}, function() {
        initSucc = true;
        expect(true).toBeTruthy();
        var initModule = ls(moduleDir);
        // expect(installModules).toEqual(['base', 'class', 'events', 'handlerbars', 'jquery', 'widget']);
        expect(initModule).toEqual([moduleName]);
        var packageJsonPath = path.join(moduleDir, moduleName, 'package.json');
        var packageJson = JSON.parse(fsExt.readFileSync(packageJsonPath));

        expect(packageJson.name).toEqual(moduleName);
        expect(packageJson.version).toEqual('1.0.0');
      });
    });

    waitsFor(function() {
      return initSucc;
    });
  }); 

  it('test init empty project by default name', function() {
    var initSucc = false
    var moduleName = 'dir_name';
    runs(function() {
      init.run({base: path.join(moduleDir, moduleName), 'module-type': 2}, function() {
        initSucc = true;
        expect(true).toBeTruthy();
        var initModule = ls(moduleDir);
        expect(initModule).toEqual([moduleName]);
        var packageJsonPath = path.join(moduleDir, moduleName, 'package.json');
        var packageJson = JSON.parse(fsExt.readFileSync(packageJsonPath));

        expect(packageJson.name).toEqual(moduleName);
        expect(packageJson.version).toEqual('1.0.0');
      });
    });

    waitsFor(function() {
      return initSucc;
    });
  }); 
});
