/**
 * @fileoverview spm install.
 * @author lifesinger@gmail.com (Frank Wang)
 */

var fs = require('fs');
var path = require('path');

var ActionFactory = require('../core/action_factory.js');
var fsExt = require('../utils/fs_ext.js');


var Install = ActionFactory.create('Install');

Install.prototype.registerArgs = function() {
  var opts = this.opts;
  opts.help('install a module.\nusage: spm install [options] name[@version]');
  opts.add('f', 'force', 'override existing files');
  opts.add('from', 'specify the path of modules repository');
  opts.add('to',  'specify the path of modules in local filesystem');
};



var MESSAGE = {

  START: '  Start installing ...',

  NOT_FOUND: "\nError: Cannot find module '%s'\n",

  ALREADY_EXISTS: '\n   ** This module already exists: %s\n' +
      '      Turn on --force option if you want to override it.\n',

  SUCCESS: '  Installed to %s/%s/'
};


Install.CONFIG = {
  FROM: 'http://modules.seajs.org/'
};


var CONFIG = Install.CONFIG;

var argv;

Install.prototype.run = function(callback) {
  argv = this.opts.argv;
  callback || (callback = noop);
  var modules = this.modules;

  // spm install
  if (modules.length === 0) {
    console.info(opts.help());
    callback({ errCode: -1 });
    return;
  }

  console.log(MESSAGE.START);

  var instance = this;
  argv.from = fsExt.normalizeEndSlash(argv.from || CONFIG.FROM);
  var registry;

  fsExt.readFile(argv.from + 'registry.js', function(code) {
    code = code.replace('define({', '{').replace('});', '}');
    registry = JSON.parse(code);

    // spm install all
    if (modules[0] === 'all') {
      modules = Object.keys(registry);
    }

    batch(modules);
  });

  
  function batch(names) {
    names.forEach(function(name) {
      instance.getMeta(name, registry, function(err, meta) {
        if (err) {
          callback(err);
        }
        else {
          batch(getDependencies(meta));
          instance.install(meta, callback);
        }
      });
    });
  }
};


Install.prototype.getMeta = function(arg, registry, callback) {
  var parts = arg.split('@');
  var name = parts[0];
  var version = parts[1];
  var meta = registry[name];

  // spm install not-exists
  if (!meta) {
    console.log(MESSAGE.NOT_FOUND, name);
    callback({ errCode: -2 });
    return;
  }

  // spm install name[@version]
  parts[1] && (meta.version = version);

  // such as http://modules.seajs.org/jquery/1.7.1/
  meta.installFrom = argv.from +
      [meta.dirpath, meta.version, ''].join('/');

  // get files to install
  var files = [];
  files.push(meta.filename + '.js'); // must have min version
  if (meta.src) files.push(meta.filename + '-debug.js');
  if (meta.extra) files = files.concat(meta.extra);
  meta.installFiles = files;

  callback(0, meta);
};


Install.prototype.install = function(meta, callback) {
  var dir = path.join(meta.dirpath, meta.version);
  var to = path.resolve(argv.to, dir);

  // spm install already-exists
  if (fs.existsSync(to) && !argv.force) {
    console.log(MESSAGE.ALREADY_EXISTS, dir);
    callback({ errCode: -3 });
    return;
  }

  // spm install name
  fsExt.mkdirS(to);
  meta.installTo = to;
  done.N = meta.installFiles.length;

  meta.installFiles.forEach(function(file) {
    fsExt.readFile(meta.installFrom + file, function(code) {
      fs.writeFileSync(path.join(to, file), code, 'utf8');
      done();
    });
  });

  function done() {
    if (typeof done.times === 'undefined') {
      done.times = 0;
    }

    if (++done.times === done.N) {
      console.log(MESSAGE.SUCCESS, meta.name, meta.version);
      callback({ 'meta': meta });
    }
  }
};


function getDependencies(meta) {
  var deps = meta.dependencies || [];

  // "dependencies": {
  //   "a": ">=1.2.0"
  // }
  if (typeof deps === 'object') {
    deps = Object.keys(deps);
  }
  // @dependencies a,b
  else if (typeof deps === 'string') {
    deps = deps.split(/\s*,\s*/);
  }

  return deps;
}


function noop() {

}


module.exports = Install;
