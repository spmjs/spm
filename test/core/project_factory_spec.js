var path = require('path');
var fsExt = require('../../lib/utils/fs_ext.js');

describe('project model parse test', function() {
  var spmConfigTestModuleDir = path.join(path.dirname(module.filename), "../data/modules/spmConfigTest/");

  it('test spmConfig parse', function() {
    var getModel = false;
    runs(function() {
      getProjectModel(spmConfigTestModuleDir, function(model) {
        getModel = true;
        expect(model.name).toBe('spmConfigModel');
        expect(model.version).toBe('0.0.1');

        expect(model.getConfig('abc')).toEqual('abc/0.0.1');
        expect(model.getConfig('to')).toEqual('abc/0.0.1/def/app');
      });
    });
    
    waitsFor(function() {
      return getModel; 
    }, 2000);
  });
});
