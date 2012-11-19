var should = require('should');
var path = require('path');
var fsExt = require('../../lib/utils/fs_ext.js');

var spm = require('../../lib/spm.js'); // require('spm');
var build = spm.getAction('build');

var tplModule = path.join(path.dirname(module.filename), "../data/modules/tplModule/");

describe('spm tpl test', function() {

  it('test tpl replaced', function(done) {
    executeBuildAction(tplModule, function(model) {
      var distCodePath = path.join(model.distDirectory, 'a-debug.js');
      var moduleDebugCode = fsExt.readFileSync(distCodePath);

      should.exist(moduleDebugCode);
      moduleDebugCode.should.include('<div>tpl</div>');
      moduleDebugCode.should.include('<div>html</div>');
      moduleDebugCode.should.include('<div>htm</div>');
      done();
    });
  });
});

function executeBuildAction(moduleDir, callback) {
  build.run({
    base: moduleDir,
    'source-files': []
  }, callback);
}

