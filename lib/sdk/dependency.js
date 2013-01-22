var fs = require('fs');
var path = require('path');
var _ = require('underscore');
var ast = require('./ast');
var iduri = require('./iduri');
var logging = require('colorful').logging;


exports.parse = function(file, obj) {
  return getRelativeDependencies(file, obj || {});
};

function getModuleDependencies(id, encoding) {
  encoding = encoding || 'utf8';
  // project modules path is `sea-modules`
  var file = path.join('sea-modules', id), data;

  // flat ast.parseDefines value to dependencies list
  var flatdeps = function(rets) {
    var deps = [];
    rets.forEach(function(ret) {
      ret.dependencies.forEach(function(dep) {
        if (!_.contains(deps, dep)) {
          deps.push(dep);
        }
      });
    });
    return deps;
  };
  if (fs.existsSync(file)) {
    data = fs.readFileSync(file, encoding);
    return flatdeps(ast.parseDefines(data));
  }
  // global modules path is ~/.spm/sea-modules
  var modulePath = path.join(process.env.HOME, '.spm', 'sea-modules');
  file = path.join(modulePath, id);
  if (fs.existsSync(file)) {
    data = fs.readFileSync(file, encoding);
    return flatdeps(ast.parseDefines(data));
  }
  logging.warn('cannot find %s', id);
  return [];
}

function getRelativeDependencies(file, obj, basefile) {
  if (basefile) {
    file = path.join(path.dirname(basefile), file);
  }
  file = iduri.appendext(file);
  var encoding = obj.encoding || 'utf8';
  var data = fs.readFileSync(file, encoding);

  var depsInRequire = ast.getRequires(data);
  if (!depsInRequire.length) return [];
  var id, deps = [];
  depsInRequire.forEach(function(name) {
    id = iduri.generateId(obj, name);
    if (_.contains(deps, id)) {
      return;
    } else {
      deps.push(id);
    }
    if (id.charAt(0) === '.') {
      deps = _.union(deps, getRelativeDependencies(id, obj, file));
    } else {
      var moduleDeps = getModuleDependencies(id, encoding);
      if (moduleDeps && moduleDeps.length) {
        deps = _.union(deps, moduleDeps);
      }
    }
  });
  return deps;
}
