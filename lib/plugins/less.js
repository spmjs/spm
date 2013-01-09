var fs = require('fs');
var path = require('path');
var less = require('less');
var async = require('async');
var _ = require('underscore');

var Plugin = require('../core/plugin.js');
var fsExt = require('../utils/fs_ext.js');
var depUtil = require('../utils/dependences.js');
var moduleHelp = require('../utils/module_help.js');
var Ast = require('../utils/ast.js');

var isLess = moduleHelp.isLess;
var lessPlugin = module.exports = Plugin.create('less');

lessPlugin.run = function(project, callback) {
  var build = project.buildDirectory;
  var enableLess = project.getConfig('less');

  if (_.isBoolean(enableLess) && !enableLess) {
    console.info('skip less compile!');
    callback();
    return;
  }

  var hasLessMod = false;
  async.forEach(fsExt.list(build, /less$/), function(moduleName, callback) {
    toCSS(build, moduleName, function(err, css) {
      if (err) {
        callback(err);
        return;
      }

      hasLessMod = true;
      fs.unlinkSync(path.join(build, moduleName));
      moduleName = moduleName.replace(/less$/, 'less.css');
      fsExt.writeFileSync(path.join(build, moduleName), css);
      callback();
    });
  }, function(err) {
    if (err) {
      console.error(err);
      throw new Error(err.message);
    }
  });

  if (hasLessMod) {
    console.info('find less script!');

    // replace require
    fsExt.listFiles(build, /js$/).forEach(function(f) {
      var code = fsExt.readFileSync(f);
      var deps = depUtil.parseDynamic(code);
      var hasLessRequire = deps.some(function(dep) {
        return isLess(dep); 
      });
      
      if (hasLessRequire) {

        code = Ast.replaceRequireValue(code, function(value) {
          return value.replace(/less$/, 'less.css');
        });
        
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
  parser.parse(code, function(err, tree) {
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

    if (_.isString(value)) {
      value = [value];
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
