var path = require('path');
var UglifyJS = require('uglify-js');
var _ = require('underscore');

var Plugin = require('../core/plugin.js');
var DepUtil = require('../utils/dependences.js');
var Ast = require('../utils/ast.js');
var fsExt = require('../utils/fs_ext.js');

var plugin = module.exports = Plugin.create('json');

plugin.run = function(project, callback) {

  var convertJson = project.getConfig('convertJson');

  if (_.isBoolean(convertJson) && !convertJson) {
    callback();
    return;
  }

  var build = project.buildDirectory;
  var moduleCache = project.moduleCache;
  var code, files;

  files = fsExt.list(build, /\.js$/).forEach(function(file) {
    var filepath = path.join(build, file);
    var code = fsExt.readFileSync(filepath);
    var allDeps = DepUtil.parseDynamic(code);

    var hasJson = allDeps.some(function(dep) {
      return isJson(dep); 
    });

    if (hasJson) {
      code = Ast.replaceRequireNode(code, isJson, function(node, depModName) {
        var jsonFilepath = project.getDepModulePath(filepath, depModName);
        var jsonCode = fsExt.readFileSync(jsonFilepath);
        var jsonObj;
        try {
          jsonObj = JSON.parse(jsonCode);
          return getJsonNode(jsonCode);
        } catch(e) {
          console.warn('无法编译 ' + jsonFilepath);
          return node;
        }
      });

      fsExt.writeFileSync(filepath, code);
    }
  });

  callback();
};

function isJson(name) {
  return /\.json$/.test(name);
}

function getJsonNode(jsonCode) {
  var jsonNode;
  var findJsonNode = new UglifyJS.TreeWalker(function(node, descend) {
    if (node instanceof UglifyJS.AST_Object) {
      if (findJsonNode.parent().start.value === '(') {
        jsonNode = node;
      }
    }
  });

  var ast = UglifyJS.parse('(' + jsonCode + ')');
  ast.walk(findJsonNode);
  return jsonNode;
}

