
var fs = require('fs');
var path = require('path');
var less = require('less');
var async = require('async');
var Plugin = require('../core/plugin.js');
var fsExt = require('../utils/fs_ext.js');

var lessPlugin = module.exports = Plugin.create('less');
lessPlugin.param('build', '%buildDirectory%');
lessPlugin.param('enableLess', true, 'enable less compile.');
lessPlugin.param('source-files', null, 'set directory which need to compile.');

lessPlugin.run = function(callback) {
  if (!this.enableLess && !this['source-files']) {
    console.info('skip less compile!');
    callback();
    return;
  }
  
  var that = this;
  var dir = this['source-files'] || this.build;
  var project = this.project;
  var haveLess = false;
  async.forEach(fsExt.list(dir, /less$/), function(moduleName, callback) {
    toCSS(dir, moduleName, function(err, css) {
      if (err) {
        callback(err);
        return;
      }

      haveLess = true;
      fs.unlinkSync(path.join(dir, moduleName));
      moduleName = moduleName.replace(/less$/, 'less.css');
      fsExt.writeFileSync(path.join(dir, moduleName), css);
      callback();
    });
  }, function(err) {
    if (err) {
      console.error(err);
      throw err.message;
    }
  });

  if (haveLess) {
    console.info('find less script!');
    var lessModPattern = project.getReqModRegByType('[^\"\']+\\.less');
    // replace require
    fsExt.listFiles(dir, /js$/).forEach(function(f) {
      var code = fsExt.readFileSync(f);
      if (lessModPattern.test(code)) {
        code = filterLessRequire(f, code, project);
        fsExt.writeFileSync(f, code);
      }
    });

    filterOutput(project.output);
  }
  callback();
};


function toCSS(dir, moduleName, callback) {
  var tree, css;
  console.log(path.join(dir, moduleName));
  var code = fsExt.readFileSync(path.join(dir, moduleName));
  var parser = new less.Parser({
    paths: dir,
    optimization: 0,
    filename: moduleName
  });
  var a = parser.parse(code, function(err, tree) {
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

// 如果进行less 编译，对output进行检查更新.
var lessTypeReg = /less$/;
function filterOutput(output) {
  Object.keys(output).forEach(function(itemName) {
    if (lessTypeReg.test(itemName)) {
      var value = output[itemName];
      delete output[itemName];
      itemName = getLessCss(itemName);
      if (typeof value === 'string') {
        value = [value];
      }

      value.forEach(function(subItem, index) {
        if (lessTypeReg.test(subItem)) {
          value.splice(index, 1, getLessCss(subItem));
        }
      });

      output[itemName] = value;
    }
  });
}

function getLessCss(lessName) {
  return lessName.replace(lessTypeReg, 'less.css');
}
