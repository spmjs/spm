var path = require('path');
var fsExt = require('../../lib/utils/fs_ext.js');

var spm = require('../../lib/spm.js'); // require('spm');
var build = spm.getAction('build');

var baseDir = path.join(path.dirname(module.filename), '../data/modules/css_modules');
var baseModuleDir = path.join(baseDir, 'm_css_base');
var globalRequireDir = path.join(baseDir, 'm_global_output');
var jsRequireDir = path.join(baseDir, 'm_js_css');

describe('spm build css module test', function() {

  it('test css parent model info', function() {
    getProjectModel(baseDir, function(moduleA) {
      expect(moduleA).not.toBe(null);
      expect(moduleA.root).toEqual('alice');
      expect(moduleA.version).toEqual('1.0.0');
    });
  });

  it('test css module build', function() {
    var buildOver = false;
    runs(function() {
      executeBuildAction(baseModuleDir, function(model) {
        var f1 = path.join(model.distDirectory, 'base1-debug.css');
        var f2 = path.join(model.distDirectory, 'base2-debug.css');
        var f3 = path.join(model.distDirectory, 'base1.css');
        var f4 = path.join(model.distDirectory, 'base2.css');
        
        var code1 = fsExt.readFileSync(f1);
        var code2 = fsExt.readFileSync(f2);
        var code3 = fsExt.readFileSync(f3);
        var code4 = fsExt.readFileSync(f4);

        expect(code1).toBeDefined();
        expect(code2).toBeDefined();
        expect(code3).toBeDefined();
        expect(code4).toBeDefined();

        expect(code1).toContain('/** alice/m_css_base/1.0.0/base1.css **/')
        expect(code1).toContain('.base1 {')
        expect(code2).toContain('/** alice/m_css_base/1.0.0/a.css **/')
        expect(code2).toContain('/** alice/m_css_base/1.0.0/b.css **/')
        expect(code2).toContain('.a {')
        expect(code2).toContain('.b {')
        expect(code3).toContain('.base1{color:#000;background:#fff}');
        expect(code4).toContain('.a{color:#000;background:#fff}.b{color:#000;background:#fff}');
        
        buildOver = true;
      });
    });

    waitsFor(function() {
      return buildOver;
    });
  
  });

  it('test global css module require', function() {
    var buildOver = false;
    runs(function() {
      executeBuildAction(globalRequireDir, function(model) {
        var f1 = path.join(model.distDirectory, 'g1-debug.css');
        var f2 = path.join(model.distDirectory, 'g1.css');
        var code1 = fsExt.readFileSync(f1);
        var code2 = fsExt.readFileSync(f2);

        expect(code1).toBeDefined();
        expect(code2).toBeDefined();

        // 测试合并全局模块是否成功。
        expect(code1).toContain('/** alice/m_css_base/1.0.0/a.css **/')
        expect(code1).toContain('/** alice/m_css_base/1.0.0/b.css **/')
        expect(code1).toContain('/** alice/m_css_base/1.0.0/base1.css **/')

        // 本地模块合并。
        expect(code1).toContain('/** alice/m_global_output/1.0.0/g1.css **/');
      
        expect(code2).toContain('.a{color:#000;background:#fff}.b{color:#000;background:#fff}');
        expect(code2).toContain('.g1{color:#000;background:#fff}.base1{color:#000;background:#fff}');

        buildOver = true;
      });
    });

    waitsFor(function() {
      return buildOver;
    });
  });

  it('test js module require css module', function() {
    var buildOver = false;
    runs(function() {
      executeBuildAction(jsRequireDir, function(model) {
        var f1 = path.join(model.distDirectory, 'a-debug.js');
        var f2 = path.join(model.distDirectory, 'b-debug.js');
        var code1 = fsExt.readFileSync(f1);
        var code2 = fsExt.readFileSync(f2);

        expect(code1).toBeDefined();
        expect(code2).toBeDefined();

        expect(code1).toContain('define("alice/m_js_css/1.0.0/a-debug", ["./base2.css"]');
        expect(code1).toContain("var c = require('./base2.css')");

        expect(code2).toContain('define("alice/m_js_css/1.0.0/b-debug", ["./base2.css", "./base1.css"]');
        expect(code2).toContain("var d = require('./base1.css')");
        expect(code2).toContain("var c = require('./base2.css')");
         
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
    base: moduleDir,
    'convert-style': 'none'
  }, callback);
}
