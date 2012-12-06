var should = require('should');
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
  
  it.skip('test init empty project by default', function(done) {
    var moduleName = 'testModule';
    init.run({projectName: moduleName, base: path.join(moduleDir, moduleName), 'module-type': "name=base"}, function() {
      var initModule = ls(moduleDir);
      // expect(installModules).toEqual(['base', 'class', 'events', 'handlerbars', 'jquery', 'widget']);
      initModule.should.eql([moduleName]);
      var packageJsonPath = path.join(moduleDir, moduleName, 'package.json');
      var packageJson = JSON.parse(fsExt.readFileSync(packageJsonPath));

      packageJson.name.should.eql(moduleName);
      packageJson.version.should.eql('1.0.0');
      done();
    });
  }); 

  it.skip('test init empty project by default name', function(done) {
    var moduleName = 'dir_name';
    init.run({base: path.join(moduleDir, moduleName), 'module-type': 'name=base'}, function() {
      var initModule = ls(moduleDir);
      initModule.should.eql([moduleName]);
      var packageJsonPath = path.join(moduleDir, moduleName, 'package.json');
      var packageJson = JSON.parse(fsExt.readFileSync(packageJsonPath));

      packageJson.name.should.eql(moduleName);
      packageJson.version.should.eql('1.0.0');
      done();
    });
  }); 
});
