
var fs = require('fs');
var path = require('path');
var less = require('less');
var Plugin = require('../core/plugin.js');
var fsExt = require('../../../utils/fs_ext.js');

var lessPlugin = module.exports = Plugin.create('less');

lessPlugin.run = function(callback) {
  var that = this;
  var project = this.project;
  var haveLess = false;
  fsExt.list(this.build, /less$/).forEach(function(moduleName) {
    toCSS(that.build, moduleName, function(err, css) {
      if (err) {
        throw err;
      }
      haveLess = true;
      fs.unlinkSync(path.join(that.build, moduleName));
      moduleName = moduleName.replace(/less$/, 'less.css');
      fsExt.writeFileSync(path.join(that.build, moduleName), css);
    });
  });

  if (haveLess) {
    console.info('find less script!');
    var lessModPattern = project.getReqModRegByType('[^\"\']+\\.less');

    // replace require
    var allJs = fsExt.listFiles(this.build, /js$/).forEach(function(f) {
      var code = fsExt.readFileSync(f);
      if (lessModPattern.test(code)) {
        code = filterLessRequire(f, code, project);   
        fsExt.writeFileSync(f, code);
      }
    
    });

  }
  callback();

};

lessPlugin.param('build', '%buildDirectory%');

function toCSS(dir, moduleName, callback) {
  var tree, css;
  console.log(path.join(dir, moduleName))
  var code = fsExt.readFileSync(path.join(dir, moduleName));
  var parser = new less.Parser();
  var a = parser.parse(code, function (err, tree) {
      if (err) {
         callback(err);
      } else {
        try {
          css = tree.toCSS();
          callback(null, css);
        } catch (e) {
           callback(e);
        }
      }
   });
}

function filterLessRequire(filepath, code, project) {
  var coffeeModPattern = project.getReqModRegByType('[^\"\']+\\.less');
  return code.replace(coffeeModPattern, function(match, sep, mark, depModName) {

    if (/less$/.test(depModName)) {
      return sep + "require('" + depModName.replace(/less$/, 'less.css') + "')";
    }
    return match;
  });
}
