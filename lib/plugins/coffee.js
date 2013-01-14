'use strict';

// 检查模块代码中是否包含coffee文件，如果包含怎对整个项目的文件进行提前编译和替换.
// 暂时不支持关闭，因为影响后续的模块依赖分析。

var fs = require('fs');
var path = require('path');
var _ = require('underscore');
var coffee = require('coffee-script');

var Plugin = require('../core/plugin.js');
var fsExt = require('../utils/fs_ext.js');
var Ast = require('../utils/ast.js');
var moduleHelp = require('../utils/module_help.js');
var depUtil = require('../utils/dependences.js');

var isCoffee = moduleHelp.isCoffee;
var coffeePlugin = module.exports = Plugin.create('coffee');

coffeePlugin.run = function(project, callback) {
  var build = project.buildDirectory;

  var hasCoffeeMod = false;
  fsExt.listFiles(build, /coffee$/).forEach(function(f) {
    hasCoffeeMod = true;
    var code = coffee.compile(fsExt.readFileSync(f));
    var moduleName = path.relative(build, f);
    moduleName = moduleName.replace(/coffee$/, 'coffee.js');
    fs.unlinkSync(f);
    fsExt.writeFileSync(path.join(build, moduleName), code);
  });

  if (hasCoffeeMod) {
    console.info('find coffee script!');

    // replace require
    fsExt.listFiles(build, /js$/).forEach(function(f) {
      var code = fsExt.readFileSync(f);
      var deps = depUtil.parseDynamic(code);
      var hasCoffeeRequire = deps.some(function(dep) {
        return isCoffee(dep); 
      });

      if (hasCoffeeRequire) {
        code = Ast.replaceRequireValue(code, function(value) {
          if (/coffee$/.test(value)) {
            return value.replace(/coffee$/, 'coffee.js')
          } else {
            return value;
          }
        });

        fsExt.writeFileSync(f, code);

        // 检查 output

        var output = project.output;
        _.keys(output).forEach(function(key) {
          if (isCoffee(key)) {
            output[key + '.js'] = output[key];
            delete output[key];
          }
        });
      }
    });
  }
  callback();
};
