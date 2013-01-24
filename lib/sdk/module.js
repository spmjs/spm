var fs = require('fs-extra');
var path = require('path');
var _ = require('underscore');
var ast = require('./ast');
var iduri = require('./iduri');
var logging = require('colorful').logging;

/* command line */
exports.parseCommands = function(options) {
  options = options || {};
  var data = {};
  data.source = options.inputDirectory || 'src';
  data.destination = options.outputDirectory || 'dist';
  return data;
};

/* package.json
 *
 * {
 *   "spm": {
 *     "alias": {
 *       "base": "arale/base/1.0.0/base"
 *     }
 *   }
 * }
 */
exports.parsePackage = function(file) {
  file = file || 'package.json';
  var data = fs.readJSONFileSync(file);
  var deps = {}, match, key, version;
  var regex = /^((?:[a-z][a-z0-9\-]*\/)?[a-z][a-z0-9\-]*)\/(\d+\.\d+\.\d+)\/[a-z0-9\-]+$/;
  if (data.spm && data.spm.alias) {
    data.alias = data.spm.alias;
  }
  if (data.alias) {
    _.each(data.alias, function(value, key) {
      match = value.match(regex);
      if (!match) return;
      key = match[1], version = match[2];
      if (_.contains(deps, key)) {
        if (!_.contains(deps[key], version)) {
          deps[key].push(version);
        }
      } else {
        deps[key] = [version];
      }
    });
  }
  data.dependencies = deps;
  if (data.spm && data.spm.output) {
    data.output = data.spm.output;
  }
  return data;
};

exports.parseOptions = function(options) {
  if (!fs.existsSync('package.json')) {
    logging.error('package.json is required.');
    process.exit(1);
  }
  logging.debug('reading package.json');
  var data = exports.parsePackage();
  logging.debug('parse command line options');
  _.extend(data, exports.parseCommands(options));
  return data;
};

/* file dependencies */
exports.parseDependencies = function(file, obj) {
  return getRelativeDependencies(file, obj || {});
};

function getModuleDependencies(id, encoding) {
  encoding = encoding || 'utf8';
  // project modules path is `sea-modules`
  var file = path.join('sea-modules', iduri.appendext(id)), data;

  // flat ast.parseDefines value to dependencies list
  var flatdeps = function(rets) {
    var deps = [];
    rets.forEach(function(ret) {
      ret.dependencies.forEach(function(dep) {
        dep = iduri.absolute(id, dep);
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
  file = path.join(modulePath, iduri.appendext(id));
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
