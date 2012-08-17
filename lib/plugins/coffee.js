
// TODO 检查模块代码中是否包含coffee文件，如果包含怎对整个项目的文件进行提前编译和替换.

var fs = require('fs');
var path = require('path');
var coffee = require('coffee-script');
var Plugin = require('../core/plugin.js');
var fsExt = require('../utils/fs_ext.js');

var coffeePlugin = module.exports = Plugin.create('coffee');

coffeePlugin.param('build', '%buildDirectory%');
coffeePlugin.param('enableCoffee', true);

coffeePlugin.run = function(callback) {

  if (!this.enableCoffee) {
    console.info('skip coffee compile!');
    callback();
    return;
  }

  var that = this;
  var project = this.project;
  var haveCoffee = false;
  var scripts = fsExt.listFiles(this.build, /coffee$/).forEach(function(f) {
    haveCoffee = true;
    var code = coffee.compile(fsExt.readFileSync(f));
    var moduleName = path.relative(that.build, f);
    moduleName = moduleName.replace(/coffee$/, 'coffee.js');
    fs.unlinkSync(f);
    fsExt.writeFileSync(path.join(that.build, moduleName), code);
  });

  if (haveCoffee) {
    console.info('find coffee script!');
    var coffeeModPattern = project.getReqModRegByType('[^\"\']+\\.coffee');

    // replace require
    var allJs = fsExt.listFiles(this.build, /js$/).forEach(function(f) {
      var code = fsExt.readFileSync(f);
      if (coffeeModPattern.test(code)) {
        code = filterCoffeeRequire(f, code, project);
        fsExt.writeFileSync(f, code);
      }

    });
  }
  callback();
};

function filterCoffeeRequire(filepath, code, project) {
  var coffeeModPattern = project.getReqModRegByType('[^\"\']+\\.coffee');
  return code.replace(coffeeModPattern, function(match, sep, mark, depModName) {

    if (/coffee$/.test(depModName)) {
      return sep + "require('" + depModName.replace(/coffee$/, 'coffee.js') + "')";
    }
    return match;
  });
}

