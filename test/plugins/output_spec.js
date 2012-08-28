var path = require('path');
var fsExt = require('../../lib/utils/fs_ext.js');

var ActionFactory = require('../../lib/core/action_factory.js');
var depsPlugin = require('../../lib/plugins/dependencies.js');

var action = 'build';
var buildAction = ActionFactory.getActionObj(action);

var outputTestDir = path.join(path.dirname(module.filename), "../data/modules/outputTest/");
var distDir = path.join(outputTestDir, 'dist');

describe('spm build output plugin test', function() {
  var model;
  beforeEach(function() {
    var buildOver = false;

    runs(function() {
      executeBuildAction(outputTestDir, function(m) {
        model = m;
        buildOver = true;
      });
    });

    waitsFor(function() {
      return buildOver;    
    });
  });

  var jqReg = getRegById('#jquery/1.7.2/jquery-debug');

  it('test module build', function() {
    expect(model.name).toEqual('outputTest'); 
  });
 
  it('test arrayMerge ', function() {
    var arrayMergeCode = getDistCode('arrayMerge-debug.js'); 
    var d1 = /define\("outputTest\/0.0.1\/arrayMerge-debug/;
    var d2 = /define\("outputTest\/0.0.1\/a-debug"/;
    var d3 = /define\("outputTest\/0.0.1\/b-debug"/;
    var d4 = /define\("outputTest\/0.0.1\/c-debug"/;
    expect(arrayMergeCode).toMatch(d1);
    expect(arrayMergeCode).toMatch(d2);
    expect(arrayMergeCode).toMatch(d3);
    expect(arrayMergeCode).toMatch(d4);
  });

  it('test local merge ', function() {
    var localMergeCode = getDistCode('localMerge-debug.js'); 
    var d1 = /define\("outputTest\/0.0.1\/localMerge-debug/;
    var d2 = /define\("outputTest\/0.0.1\/a-debug"/;
    var d3 = /define\("outputTest\/0.0.1\/b-debug"/;
    var d4 = /define\("outputTest\/0.0.1\/c-debug"/;
    expect(localMergeCode).toMatch(d1);
    expect(localMergeCode).toMatch(d2);
    expect(localMergeCode).toMatch(d3);
    expect(localMergeCode).toMatch(d4);
  });

  it('test all merge ', function() {
    var allMergeCode = getDistCode('allMerge-debug.js'); 
    var d1 = getRegByModel(model, 'allMerge-debug');
    var d2 = getRegByModel(model, 'a-debug');
    var d3 = getRegByModel(model, 'b-debug');
    var d4 = getRegByModel(model, 'c-debug');
    var d5 = getRegById('#widget/1.0.0/auto-render-debug');
    var d6 = getRegById('#base/1.0.0/base-debug');
    var d7 = getRegById('#class/1.0.0/class-debug');
    var d8 = getRegById('#events/1.0.0/events-debug');
    var d9 = getRegById('#widget/1.0.0/widget-debug');
    var d10 = getRegById('#base/1.0.0/aspect-debug');

    var d11 = getRegByModel(model, 'plugins/p1-debug');
    var d12 = getRegByModel(model, 'plugins/p2-debug');

    expect(allMergeCode).toMatch(d1);
    expect(allMergeCode).toMatch(d2);
    expect(allMergeCode).toMatch(d3);
    expect(allMergeCode).toMatch(d4);
    expect(allMergeCode).toMatch(d5);
    expect(allMergeCode).toMatch(d6);
    expect(allMergeCode).toMatch(d7);
    expect(allMergeCode).toMatch(d8);
    expect(allMergeCode).toMatch(d9);
    expect(allMergeCode).toMatch(d10);
    expect(allMergeCode).toMatch(d11);

    expect(allMergeCode).not.toMatch(jqReg);
    expect(allMergeCode).not.toMatch(d12);
  
  });

 
  it('test exclude merge module A', function() {
  
    var excludeMergeCode = getDistCode('excludeMergeA-debug.js'); 

    var d1 = getRegByModel(model, 'excludeMergeA-debug');
    var d2 = getRegByModel(model, 'a-debug');
    var d3 = getRegByModel(model, 'b-debug');
    var d4 = getRegByModel(model, 'c-debug');

    expect(excludeMergeCode).not.toMatch(jqReg);

    expect(excludeMergeCode).toMatch(d1);
    expect(excludeMergeCode).not.toMatch(d2);
    expect(excludeMergeCode).toMatch(d3);
    expect(excludeMergeCode).toMatch(d4);


  });

  it('test exclude merge module B', function() {
  
    var excludeMergeCode = getDistCode('excludeMergeB-debug.js'); 

    var d1 = getRegByModel(model, 'excludeMergeB-debug');
    var d2 = getRegByModel(model, 'a-debug');
    var d3 = getRegByModel(model, 'b-debug');
    var d4 = getRegByModel(model, 'c-debug');

    var d5 = getRegById('#widget/1.0.0/auto-render-debug');
    var d6 = getRegById('#base/1.0.0/base-debug');
    var d7 = getRegById('#class/1.0.0/class-debug');
    var d8 = getRegById('#events/1.0.0/events-debug');
    var d9 = getRegById('#widget/1.0.0/widget-debug');

    expect(excludeMergeCode).not.toMatch(jqReg);

    expect(excludeMergeCode).toMatch(d1);
    expect(excludeMergeCode).toMatch(d2);
    expect(excludeMergeCode).toMatch(d3);
    expect(excludeMergeCode).toMatch(d4);

    expect(excludeMergeCode).not.toMatch(d5);
    expect(excludeMergeCode).toMatch(d6);
    expect(excludeMergeCode).toMatch(d7);
    expect(excludeMergeCode).toMatch(d8);
    expect(excludeMergeCode).not.toMatch(d9);
  });
});

function getRegById(id) {
  return new RegExp('define' + '\\("' + id);
}

function getRegByModel(model, moduleName) {
  return new RegExp('define' + '\\("' + model.name + '\\/' + model.version + '\\/' + moduleName);
}
function executeBuildAction(moduleDir, callback) {
  getProjectModel(action, moduleDir, function(model) {
    buildAction.execute(model, function(err) {
      expect(err).toBeFalsy();
      callback(model);
    });
  });
}

function getDistCode(name) {
  return fsExt.readFileSync(path.join(distDir, name));
}
