var fs = require('fs');
var path = require('path');
var util = require('util');
var _ = require('underscore');
var Class = require('arale').Class;
var logging = require('colorful').logging;
var dependency = require('./dependency');
var iduri = require('./iduri');


var BaseCompiler = Class.create({
  name: 'BaseCompiler',
  ext: '',
  initialize: function(data, obj) {
    obj = obj || {};
    if (!data && obj.filepath) {
      data = fs.readFileSync(obj.filepath, obj.encoding || 'utf8');
    }
    this.data = data;
    this.options = obj;
  },
  validate: function() {
    var ext = path.extname(obj.filepath || '').slice(1);
    return ext === this.ext;
  },
  compile: function(callback) {
    if (!callback) return this.data;
    callback(this.data);
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
    var deps = getRelativeDependencies(obj.filepath, obj);
    logging.info('dependencies: %s', deps);

    data = dependency.replaceRequire(ast, function(value) {
      return iduri.generateId(obj, value);
    });

    var id = getId(obj);
    data = dependency.replaceDefine(data, id, deps);
    if (!callback) return data;
    callback(data);
  }
});
exports.JSCompiler = JSCompiler;

var CSSCompiler = BaseCompiler.extend({
  name: 'CSS Compiler',
  ext: 'css',
  compile: function(callback) {
    var obj = this.options, data = this.data;

    // TODO compress css
    var id = getId(obj);
    var code = util.format(
      'define("%s", [], function() { seajs.importStyle("%s") })', id,
      data.replace(/\"/g, '\\\"')
    );
    data = dependency.getAst(code).print_to_string();
    if (!callback) return data;
    callback(data);
  }
});
exports.CSSCompiler = CSSCompiler;


var TplCompiler= BaseCompiler.extend({
  name: 'Template Compiler',
  ext: 'tpl',
  compile: function(callback) {
    var obj = this.options, data = this.data;
    var id = getId(obj);
    var code = util.format('define("%s", [], "%s")', id, data.replace(/\"/g, '\\\"'));
    data = dependency.getAst(code).print_to_string();
    if (!callback) return data;
    callback(data);
  }
});
exports.TplCompiler = TplCompiler;


// helpers

function getId(obj, filepath) {
  if (!filepath) filepath = obj.filepath;

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
