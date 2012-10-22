var fs = require('fs');
var path = require('path');
var less = require('less');
var async = require('async');
var Plugin = require('../core/plugin.js');
var fsExt = require('../utils/fs_ext.js');

var lessPlugin = module.exports = Plugin.create('less');
lessPlugin.param('enableLess', true, 'enable less compile.');

lessPlugin.run = function(project, callback) {
  var argv = this.argv;
  if (!this.enableLess && !argv['source-files']) {
    console.info('skip less compile!');
    callback();
    return;
  }

  var that = this;
  var dir = argv['source-files'] || project.buildDirectory;
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
      throw new Error(err.message);
    }
  });

  if (haveLess) {
    console.info('find less script!');
    var lessModPattern = project.getReqModRegByType('[^\"\']+\\.less', false);
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
  var lessModPattern = project.getReqModRegByType('[^\"\']+\\.less');
  return code.replace(lessModPattern, function(match, sep, mark, depModName) {

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
    var value = output[itemName];
   
    if (lessTypeReg.test(itemName)) {
      delete output[itemName];
      itemName = getLessCss(itemName);
    }

    if (value === 'default' || value === '.' || value === '*') {
      return;
    }

    value.forEach(function(subItem, index) {
      if (lessTypeReg.test(subItem)) {
        value.splice(index, 1, getLessCss(subItem));
      }
    });

    output[itemName] = value;
  });
}

function getLessCss(lessName) {
  return lessName.replace(lessTypeReg, 'less.css');
}
