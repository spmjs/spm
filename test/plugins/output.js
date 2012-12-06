var should = require('should');
var path = require('path');
var fsExt = require('../../lib/utils/fs_ext.js');
require('../module.js');

var spm = require('../../lib/spm.js'); // require('spm');
var build = spm.getAction('build');

var outputTestDir = path.join(path.dirname(module.filename), "../data/modules/outputTest/");
var distDir = path.join(outputTestDir, 'dist');

describe('spm build output plugin test', function() {
  var model;
  beforeEach(function(done) {
    executeBuildAction(outputTestDir, function(m) {
      model = m;
      done();
    });
  });

  var jqReg = getRegById('gallery/jquery/1.7.2/jquery-debug');

  it('test module build', function() {
    model.name.should.eql('outputTest'); 
  });
 
  it('test arrayMerge ', function() {
    var arrayMergeCode = getDistCode('arrayMerge-debug.js'); 
    var d1 = /define\("test\/outputTest\/0.0.1\/arrayMerge-debug/;
    var d2 = /define\("test\/outputTest\/0.0.1\/a-debug"/;
    var d3 = /define\("test\/outputTest\/0.0.1\/b-debug"/;
    var d4 = /define\("test\/outputTest\/0.0.1\/c-debug"/;
    arrayMergeCode.should.match(d1);
    arrayMergeCode.should.match(d2);
    arrayMergeCode.should.match(d3);
    arrayMergeCode.should.match(d4);
  });

  it('test local merge ', function() {
    var localMergeCode = getDistCode('localMerge-debug.js'); 
    var d1 = /define\("test\/outputTest\/0.0.1\/localMerge-debug/;
    var d2 = /define\("test\/outputTest\/0.0.1\/a-debug"/;
    var d3 = /define\("test\/outputTest\/0.0.1\/b-debug"/;
    var d4 = /define\("test\/outputTest\/0.0.1\/c-debug"/;
    localMergeCode.should.match(d1);
    localMergeCode.should.match(d2);
    localMergeCode.should.match(d3);
    localMergeCode.should.match(d4);
  });

  it('test all merge ', function() {
    var allMergeCode = getDistCode('allMerge-debug.js'); 
    var d1 = getRegByModel(model, 'allMerge-debug');
    var d2 = getRegByModel(model, 'a-debug');
    var d3 = getRegByModel(model, 'b-debug');
    var d4 = getRegByModel(model, 'c-debug');
    var d5 = getRegById('arale/widget/1.0.2/auto-render-debug');
    var d6 = getRegById('arale/base/1.0.1/base-debug');
    var d7 = getRegById('arale/class/1.0.0/class-debug');
    var d8 = getRegById('arale/events/1.0.0/events-debug');
    var d9 = getRegById('arale/widget/1.0.2/widget-debug');
    var d10 = getRegById('arale/base/1.0.1/aspect-debug');

    var d11 = getRegByModel(model, 'plugins/p1-debug');
    var d12 = getRegByModel(model, 'plugins/p2-debug');

    allMergeCode.should.match(d1);
    allMergeCode.should.match(d2);
    allMergeCode.should.match(d3);
    allMergeCode.should.match(d4);
    allMergeCode.should.match(d5);
    allMergeCode.should.match(d6);
    allMergeCode.should.match(d7);
    allMergeCode.should.match(d8);
    allMergeCode.should.match(d9);
    allMergeCode.should.match(d10);
    allMergeCode.should.match(d11);

    allMergeCode.should.not.match(jqReg);
    // 因为 全局排除
    allMergeCode.should.not.match(d12);
  
  });

 
  it('test exclude merge module A', function() {
  
    var excludeMergeCode = getDistCode('excludeMergeA-debug.js'); 

    var d1 = getRegByModel(model, 'excludeMergeA-debug');
    var d2 = getRegByModel(model, 'a-debug');
    var d3 = getRegByModel(model, 'b-debug');
    var d4 = getRegByModel(model, 'c-debug');

    excludeMergeCode.should.not.match(jqReg);

    excludeMergeCode.should.match(d1);
    excludeMergeCode.should.not.match(d2);
    excludeMergeCode.should.match(d3);
    excludeMergeCode.should.match(d4);
  });

  it('test exclude merge module B', function() {
  
    var excludeMergeCode = getDistCode('excludeMergeB-debug.js'); 

    var d1 = getRegByModel(model, 'excludeMergeB-debug');
    var d2 = getRegByModel(model, 'a-debug');
    var d3 = getRegByModel(model, 'b-debug');
    var d4 = getRegByModel(model, 'c-debug');

    var d5 = getRegById('arale/widget/1.0.2/auto-render-debug');
    var d6 = getRegById('arale/base/1.0.1/base-debug');
    var d7 = getRegById('arale/class/1.0.0/class-debug');
    var d8 = getRegById('arale/events/1.0.0/events-debug');
    var d9 = getRegById('arale/widget/1.0.2/widget-debug');

    excludeMergeCode.should.not.match(jqReg);

    excludeMergeCode.should.match(d1);
    excludeMergeCode.should.match(d2);
    excludeMergeCode.should.match(d3);
    excludeMergeCode.should.match(d4);

    excludeMergeCode.should.not.match(d5);
    excludeMergeCode.should.match(d6);
    excludeMergeCode.should.match(d7);
    excludeMergeCode.should.match(d8);
    excludeMergeCode.should.not.match(d9);
  });
});

function getRegById(id) {
  return new RegExp('define' + '\\("' + id);
}

function getRegByModel(model, moduleName) {
  return new RegExp('define' + '\\("' + model.root + '\\/' +  model.name + '\\/' + model.version + '\\/' + moduleName);
}
function executeBuildAction(moduleDir, callback) {
  build.run({
    base: moduleDir,
    'source-files': []
  }, callback);
}

function getDistCode(name) {
  return fsExt.readFileSync(path.join(distDir, name));
}
