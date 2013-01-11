var fs = require('fs-extra');
var _ = require('underscore');
var ast = require('./ast');
var iduri = require('./iduri');
var logging = require('colorful').logging;


exports.getDependencies = function(file, obj) {
  return getRelativeDependencies(file, obj);
}

function getModuleDependencies(id, encoding) {
  encoding = encoding || 'utf8';
  var file = path.join('sea-modules', id), data;

  var flatdeps = function(rets) {
    var deps = [];
    rets.forEach(function(ret) {
      ret.dependencies.forEach(function(dep) {
        deps.push(dep);
      });
    });
    return deps;
  }
  if (fs.existsSync(file)) {
    data = fs.readFileSync(file, encoding);
    return flatdeps(ast.parseDefines(data));
  }
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

  var id, deps = [];
  var depsInRequire = ast.getRequires(data);
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
