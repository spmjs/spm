require('shelljs/global');
var path = require('path');

var spm = require('../../lib/spm.js'); // require('spm');
var install = spm.getAction('install');

var moduleDir = path.join(path.dirname(module.filename), '../data/install_modules/');
describe('spm install action', function() {
  afterEach(function() {
    rm('-rf', path.join(moduleDir, '*'));
  });
  
  it('test install jquery', function() {
    var installSucc = false
    runs(function() {
      install.run({modules: ['gallery.jquery', 'arale.widget'], force: true, to: moduleDir}, function() {
        installSucc = true;
        expect(true).toBeTruthy();
        var installWidgetModules = ls(path.join(moduleDir, 'arale'));
        var installJqueryModules = ls(path.join(moduleDir, 'gallery'));
        // expect(installModules).toEqual(['base', 'class', 'events', 'handlerbars', 'jquery', 'widget']);
        expect(installWidgetModules.length).toEqual(4);
        expect(installJqueryModules.length).toEqual(2);
      });
    });

    waitsFor(function() {
      return installSucc;
    });
  }); 

  it('test install jquery to default directory', function() {
    var installSucc = false
    runs(function() {
      install.run({modules: ['gallery.jquery', 'arale.widget'], force: true, base: moduleDir}, function() {
        installSucc = true;
        expect(true).toBeTruthy();
        var installModules = ls(path.join(moduleDir, 'sea-modules'));
        // expect(installModules).toEqual(['base', 'class', 'events', 'handlerbars', 'jquery', 'widget']);
        expect(installModules.length).toEqual(2);
      });
    });

    waitsFor(function() {
      return installSucc;
    });
  }); 

});
