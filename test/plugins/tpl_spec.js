var path = require('path');
var fsExt = require('../../lib/utils/fs_ext.js');

var spm = require('../../lib/spm.js'); // require('spm');
var build = spm.getAction('build');

var tplModule = path.join(path.dirname(module.filename), "../data/modules/tplModule/");

describe('spm tpl test', function() {

  it('test tpl replaced', function() {
    var buildOver = false;
    runs(function() {
      executeBuildAction(tplModule, function(model) {
        var distCodePath = path.join(model.distDirectory, 'a-debug.js');
        var moduleDebugCode = fsExt.readFileSync(distCodePath);

        expect(moduleDebugCode).toBeDefined();
        expect(moduleDebugCode).toContain('<div>tpl</div>');
        expect(moduleDebugCode).toContain('<div>html</div>');
        expect(moduleDebugCode).toContain('<div>htm</div>');
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

