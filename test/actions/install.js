var should = require('should');
require('shelljs/global');
var path = require('path');

var spm = require('../../lib/spm.js'); // require('spm');
var install = spm.getAction('install');

var moduleDir = path.join(path.dirname(module.filename), '../data/install_modules/');
describe('spm install action', function() {
  afterEach(function() {
    rm('-rf', path.join(moduleDir, '*'));
  });
  
  describe('spm install the specified directory', function() {
    it('test install jquery', function(done) {
      install.run({modules: ['gallery.jquery', 'arale.widget'], force: true, to: moduleDir}, function() {
        var installWidgetModules = ls(path.join(moduleDir, 'arale'));
        var installJqueryModules = ls(path.join(moduleDir, 'gallery'));
        // expect(installModules).toEqual(['base', 'class', 'events', 'handlerbars', 'jquery', 'widget']);

        installWidgetModules.should.have.length(4);
        installJqueryModules.should.have.length(2);
        done();
      });
    }); 
  });

  describe('install to default direcotry', function() {
    it('test install jquery', function(done) {
      install.run({modules: ['gallery.jquery', 'arale.widget'], force: true, base: moduleDir}, function() {
        var installModules = ls(path.join(moduleDir, 'sea-modules'));
        // expect(installModules).toEqual(['base', 'class', 'events', 'handlerbars', 'jquery', 'widget']);
        installModules.should.have.length(2);
        done();
      });
    }); 
  });
});
