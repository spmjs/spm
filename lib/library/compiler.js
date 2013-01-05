var fs = require('fs');
var path = require('path');
var util = require('util');
var _ = require('underscore');
var Class = require('arale').Class;
var logging = require('colorful').logging;
var dependency = require('./dependency');
var iduri = require('./iduri');
var pathlib = require('../utils/pathlib');


var BaseCompiler = Class.create({
  name: 'BaseCompiler',
  ext: ['css', 'tpl', 'txt'],
  initialize: function(filepath, obj) {
    obj = obj || {};
    this.filepath = filepath;
    this.data = fs.readFileSync(filepath, obj.encoding || 'utf8');
    this.options = obj;
  },
  validate: function(filepath) {
    filepath = filepath || this.filepath || '';
    var ext = path.extname(filepath).slice(1);
    if (_.isString(this.ext)) {
      return ext === this.ext;
    }
    if (_.isArray(this.ext)) {
      return _.contains(this.ext, ext);
    }
    return false;
  },
  write: function(filename, callback) {
    var buildir = '.spm-build';
    var saveto = path.join(buildir, filename);
    this.compile(function(data) {
      try {
        pathlib.writeFileSync(saveto, data);
        callback();
      } catch (err) {
        callback(err);
      }
    });
  },
  getfilename: function() {
    var inputdir = this.options.inputDirectory;
    var filename = this.filepath.replace(inputdir, '');
    filename = filename.replace(/^\//, '');
    return filename;
  },
  compile: function(callback) {
    if (!callback) return this.data;
    callback(this.data);
  },
  run: function(callback) {
    var filename = this.getfilename();
    this.write(filename, callback);
  }
});
exports.BaseCompiler = BaseCompiler;


var JSCompiler = BaseCompiler.extend({
  name: 'JavaScript Compiler',
  ext: 'js',
  compile: function(callback) {
    var obj = this.options, data = this.data;

    var ast = dependency.getAst(data);

    var depsInDefine = dependency.parseDefine(ast);
    // TODO logging
    if (depsInDefine) {
      // if user defined dependencies himself, we should not parse
      logging.info('dependencies: %s', depsInDefine);
      if (!callback) return data;
      callback(data);
      return;
    }
    var deps = getRelativeDependencies(this.filepath, obj);
    logging.info('dependencies: %s', deps);

    data = dependency.replaceRequire(ast, function(value) {
      return iduri.generateId(obj, value);
    });

    var id = getId(obj, this.filepath);
    data = dependency.replaceDefine(data, id, deps);
    if (!callback) return data;
    callback(data);
  }
});
exports.JSCompiler = JSCompiler;

var JCSSCompiler = BaseCompiler.extend({
  name: 'JavaScript CSS Compiler',
  ext: 'css',
  compile: function(callback) {
    var obj = this.options, data = this.data;

    // TODO compress css
    var id = getId(obj, this.filepath);
    var code = util.format(
      'define("%s", [], function() { seajs.importStyle("%s") })', id,
      data.replace(/\"/g, '\\\"')
    );
    data = dependency.getAst(code).print_to_string();
    if (!callback) return data;
    callback(data);
  },
  run: function(callback) {
    var filename = this.getfilename() + '.js';
    this.write(filename, callback);
  }
});
exports.JCSSCompiler = JCSSCompiler;


var JtplCompiler = BaseCompiler.extend({
  name: 'JavaScript Template Compiler',
  ext: 'tpl',
  compile: function(callback) {
    var obj = this.options, data = this.data;
    var id = getId(obj, this.filepath);
    var code = util.format('define("%s", [], "%s")', id, data.replace(/\"/g, '\\\"'));
    data = dependency.getAst(code).print_to_string();
    if (!callback) return data;
    callback(data);
  },
  run: function(callback) {
    var filename = this.getfilename() + '.js';
    this.write(filename, callback);
  }
});
exports.JtplCompiler = JtplCompiler;


// helpers

function getId(obj, filepath) {
  var input = obj.inputDirectory || process.cwd();
  var filename = filepath.replace(input, '').replace(/^\//, '');
  obj.filename = filename;
  return iduri.generateId(obj);
}

function getModuleDependencies(id, obj) {
  obj = obj || {};
  var encoding = obj.encoding || 'utf8';
  var file = path.join('sea-modules', id), data;
  if (fs.existsSync(file)) {
    data = fs.readFileSync(file, encoding);
    return dependency.parseDefine(data);
  }
  var modulePath = path.join(process.env.HOME, '.spm', 'sea-modules');
  file = path.join(modulePath, id);
  if (fs.existsSync(file)) {
    data = fs.readFileSync(file, encoding);
    return dependency.parseDefine(data);
  }
  logging.warn('cannot find %s', id);
  return undefined;
}

function getRelativeDependencies(file, obj, basefile) {
  if (basefile) {
    file = path.join(path.dirname(basefile), file);
  }
  file = iduri.appendext(file);
  var encoding = obj.encoding || 'utf8';
  var data = fs.readFileSync(file, encoding);

  var id, deps = [];
  var depsInRequire = dependency.parseRequire(data);
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
      var moduleDeps = getModuleDependencies(id, obj);
      if (moduleDeps && moduleDeps.length) {
        deps = _.union(deps, moduleDeps);
      }
    }
  });
  return deps;
}
