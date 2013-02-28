var path = require('path');
var should = require('should');

require('../module.js');

var fsExt = require('../../lib/utils/fs_ext.js');
var spm = require('../../lib/spm.js'); // require('spm');
var depsPlugin = require('../../lib/plugins/dependencies.js');
var build = spm.getAction('build');

var baseDir = path.join(path.dirname(module.filename), '../data/modules/css_modules');
var baseModuleDir = path.join(baseDir, 'm_css_base');
var globalRequireDir = path.join(baseDir, 'm_global_output');
var jsRequireDir = path.join(baseDir, 'm_js_css');

describe('spm build test', function() {

  it('test css parent model info', function(done) {
    getProjectModel(baseDir, function(moduleA) {
      should.exist(moduleA);
      moduleA.root.should.eql('alice');
      moduleA.version.should.eql('1.0.0');
      done();
    });
  });

  it('test css module build', function() {
    executeBuildAction(baseModuleDir, function(model) {
      var f1 = path.join(model.distDirectory, 'base1-debug.css');
      var f2 = path.join(model.distDirectory, 'base2-debug.css');
      var f3 = path.join(model.distDirectory, 'base1.css');
      var f4 = path.join(model.distDirectory, 'base2.css');
      
      var code1 = fsExt.readFileSync(f1);
      var code2 = fsExt.readFileSync(f2);
      var code3 = fsExt.readFileSync(f3);
      var code4 = fsExt.readFileSync(f4);

      should.exist(code1);
      should.exist(code2);
      should.exist(code3);
      should.exist(code4);

      code1.should.include('/** alice/m_css_base/1.0.0/base1.css **/')
      code1.should.include('.base1 {')
      //code2.should.include('/** alice/m_css_base/1.0.0/a.css **/')
      //code2.should.include('/** alice/m_css_base/1.0.0/b.css **/')
      code2.should.include('.a {')
      code2.should.include('.b {')
      code3.should.include('.base1{color:#000;background:#fff}');
      code4.should.include('.a{color:#000;background:#fff}.b{color:#000;background:#fff}');
    });
  });

  describe('global css module ', function() {
    
    beforeEach(function(done) {
      executeBuildAction(baseModuleDir, function(model) {
        done();
      });
    });
    
    it('test global css module merge', function(done) {
      executeBuildAction(globalRequireDir, function(model) {
        var f1 = path.join(model.distDirectory, 'g1-debug.css');
        var f2 = path.join(model.distDirectory, 'g1.css');
        var code1 = fsExt.readFileSync(f1);
        var code2 = fsExt.readFileSync(f2);

        should.exist(code1);
        should.exist(code2);

        // 测试合并全局模块是否成功。
        //code1.should.include('/** alice/m_css_base/1.0.0/a.css **/')
        //code1.should.include('/** alice/m_css_base/1.0.0/b.css **/')
        code1.should.include('/** alice/m_css_base/1.0.0/base1.css **/')

        // 本地模块合并。
        code1.should.include('/** alice/m_global_output/1.0.0/g1.css **/');
      
        code2.should.include('.a{color:#000;background:#fff}.b{color:#000;background:#fff}');
        code2.should.include('.g1{color:#000;background:#fff}.base1{color:#000;background:#fff}');
        done();
      });
    });
  });

  it('test js module require css module', function(done) {
    executeBuildAction(jsRequireDir, function(model) {
      var f1 = path.join(model.distDirectory, 'a-debug.js');
      var f2 = path.join(model.distDirectory, 'b-debug.js');
      var code1 = fsExt.readFileSync(f1);
      var code2 = fsExt.readFileSync(f2);

      should.exist(code1);
      should.exist(code2);

      code1.should.include('define("alice/m_js_css/1.0.0/a-debug", []');
      //code1.should.include('var c = require("./base2.css")');

      code2.should.include('define("alice/m_js_css/1.0.0/b-debug", []');
      code2.should.include("var d = require(\"alice/m_js_css/1.0.0/base1.css\")");
      //code2.should.include("var c = require(\"./base2.css\")");
      done();
    });
  });
});

function executeBuildAction(moduleDir, callback) {
  build.run({
    base: moduleDir,
    'source-files': [],
    'convert-style': 'none'
  }, callback);
}
