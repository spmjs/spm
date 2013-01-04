var fs = require('fs');
var path = require('path');
var util = require('util');
require('colorful').colorful();
var logging = require('colorful').logging;
var _ = require('underscore');
var async = require('async');
var dependency = require('../library/dependency');
var iduri = require('../library/iduri');


exports.description = 'build a cmd module';

exports.run = function(commander) {
  if (commander.interrupt) {
    logging.once('logging-warn', interrupt);
    logging.once('logging-error', interrupt);
  }
  logging.start('spm build');

  logging.debug('parsing command line arguments');
  // plugin.trigger('preparsing', commander)
  logging.debug('merge settings');

  logging.end('spm build finished!  ' + '❤'.to.magenta.color);
};


function compileFile(file, settings, callback) {
  var ext = path.extname(file).slice(1);
  // TODO: API
  var compilers = {
    'js': compileJS,
    'tpl': compileTPL,
    'css': compileCSS
  };

  var encoding = settings.encoding || 'utf8';
  var data = fs.readFileSync(file, encoding);
  var compiler = compilers[ext];
  if (!compiler) {
    logging.warn('no compiler for %s', file);
    return data;
  }
  return compiler(data, file, settings);
}

function compileJS(data, file, settings) {
  settings = settings || {};
  if (!data) {
    data = fs.readFileSync(file, settings.encoding || 'utf8');
  }
  var ast = dependency.getAst(data);

  // 1. get dependencies
  var depsInDefine = dependency.parseDefine(ast);
  // TODO logging
  if (depsInDefine) {
    // if user defined dependencies himself, we should not parse
    logging.info('dependencies: %s', depsInDefine);
    return data;
  }
  var deps = getRelativeDependencies(file, settings);
  logging.info('dependencies: %s', deps.flat);

  data = dependency.replaceRequire(ast, function(value) {
    return iduri.generateId(settings, value);
  });

  var id = getId(file, settings);
  return dependency.replaceDefine(data, id, deps.flat);
}
exports.compileJS = compileJS;

function compileTPL(data, file, settings) {
  settings = settings || {};
  if (!data) {
    data = fs.readFileSync(file, settings.encoding || 'utf8');
  }
  var id = getId(file, settings);
  var code = util.format('define("%s", [], "%s")', id, data.replace(/\"/g, '\\\"'));
  return dependency.getAst(code).print_to_string();
}
exports.compileTPL = compileTPL;

function compileCSS(data, file, settings) {
  settings = settings || {};
  if (!data) {
    data = fs.readFileSync(file, settings.encoding || 'utf8');
  }
  // TODO compress css
  var id = getId(file, settings);
  var code = util.format(
    'define("%s", [], function() { seajs.importStyle("%s") })', id,
    data.replace(/\"/g, '\\\"')
  );
  return dependency.getAst(code).print_to_string();
}
exports.compileCSS = compileCSS;


// helpers
function interrupt() {
  logging.end('The build process is interrupted!'.to.red_bg.color + '  ☂'.to.magenta.color);
  process.exit(1);
}

function getId(file, settings) {
  var input = settings.inputDirectory || process.cwd();
  var filename = file.replace(input, '').replace(/^\//, '');
  settings.filename = filename;
  return iduri.generateId(settings);
}

function getModuleDependencies(id, settings) {
  settings = settings || {};
  var encoding = settings.encoding || 'utf8';
  var file = path.join('sea-modules', id), data;
  if (fs.existsSync(file)) {
    data = fs.readFileSync(file, encoding);
    return dependency.parseDefine(data);
  }
  // TODO: rename modulePath
  var modulePath = settings.modulePath || path.join(process.env.HOME, '.spm', 'sea-modules');
  file = path.join(modulePath, id);
  if (fs.existsSync(file)) {
    data = fs.readFileSync(file, encoding);
    return dependency.parseDefine(data);
  }
  logging.warn('cannot find %s', id);
  return undefined;
}

function getRelativeDependencies(file, settings, basefile) {
  if (basefile) {
    file = path.join(path.dirname(basefile), file);
  }
  file = iduri.appendext(file);
  var encoding = settings.encoding || 'utf8';
  var data = fs.readFileSync(file, encoding);

  var id, flat = [], tree = [];
  var depsInRequire = dependency.parseRequire(data);
  depsInRequire.forEach(function(name) {
    id = iduri.generateId(settings, name);
    if (_.contains(flat, id)) {
      return;
    } else {
      flat.push(id);
    }
    if (id.charAt(0) === '.') {
      flat = _.union(flat, getRelativeDependencies(id, settings, file).flat);
    } else {
      var moduleDeps = getModuleDependencies(id, settings);
      if (moduleDeps && moduleDeps.length) {
        flat = _.union(flat, moduleDeps);
      }
    }
  });
  // TODO tree
  return {flat: flat, tree: tree};
}
