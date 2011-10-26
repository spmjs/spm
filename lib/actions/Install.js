/**
 * @fileoverview spm install.
 * @author lifesinger@gmail.com (Frank Wang)
 */

var fs = require('fs');
var path = require('path');

var ActionFactory = require('./ActionFactory');
var fsExt = require('../utils/fsExt');
var Transport = require('./Transport');


var Install = ActionFactory.create('Install');


Install.AVAILABLE_OPTIONS = {
  force: {
    alias: ['--force', '-f'],
    description: 'Override existing files.'
  },
  from: {
    alias: ['--from'],
    description: 'Specify the path of modules repository.',
    length: 1
  },
  to: {
    alias: ['--to'],
    description: 'Specify the path of modules in local filesystem.',
    length: 1
  }
};


Install.MESSAGE = {
  USAGE: 'Usage: spm install [options] name[@version]',

  DESCRIPTION: 'Install a module.',

  START: '  Start installing ...',

  NOT_FOUND: "\nError: Cannot find module '%s'\n",

  ALREADY_EXISTS: '\nError: \'%s\' already exists.\n' +
      '       If you want to override it, please turn on --force option.\n',

  SUCCESS: '  Installed to %s/%s/'
};


Install.CONFIG = {
  FROM: 'http://modules.seajs.com/'
};


var MESSAGE = Install.MESSAGE;
var CONFIG = Install.CONFIG;


Install.prototype.run = function(callback) {
  callback || (callback = noop);
  var modules = this.modules;

  // spm install
  if (modules.length === 0) {
    console.log(MESSAGE.USAGE, '\n      ', MESSAGE.DESCRIPTION);
    callback({ errCode: -1 });
    return;
  }

  console.log(MESSAGE.START);

  var instance = this;
  var options = this.options;
  options.from = normalizeEndSlash(options.from || CONFIG.FROM);
  var registry;

  fsExt.readFromPath(options.from + 'registry.js', function(code) {
    code = code.replace('define({', '{').replace('});', '}');
    registry = JSON.parse(code);

    // spm install *
    if (modules[0] === '*') {
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
  meta.name = name;
  parts[1] && (meta.version = version);
  meta.filename || (meta.filename = name);

  var BASE = this.options.from +
      path.join(meta.name, meta.version, meta.filename);

  meta.minpath = BASE + '.js';
  meta.srcpath = BASE + '-debug.js';

  callback(0, meta);
};


Install.prototype.install = function(meta, callback) {
  var options = this.options;
  var dir = path.join(meta.name, meta.version);
  var installPath = path.resolve(options.to, dir);

  // spm install already-exists
  if (path.existsSync(installPath) && !options.force) {
    console.log(MESSAGE.ALREADY_EXISTS, dir);
    callback({ errCode: -3 });
    return;
  }

  // spm install name
  fsExt.mkdirS(path.dirname(installPath));
  fsExt.mkdirS(installPath);

  var BASE = path.join(installPath, meta.filename);
  meta.localminpath = BASE + '.js';
  meta.localsrcpath = BASE + '-debug.js';

  done.N = 2;

  // get min file
  fsExt.readFromPath(meta.minpath, function(code) {
    fs.writeFileSync(meta.localminpath, code, 'utf8');
    done();
  });

  // get src file
  fsExt.readFromPath(meta.srcpath, function(code) {
    fs.writeFileSync(meta.localsrcpath, code, 'utf8');
    done();
  });

  // get extra files
  var extra = makeArray(meta['extra']);
  if (extra.length) {
    done.N++;
    Transport.getExtra(
        extra,
        path.dirname(meta.src),
        installPath,
        done
    );
  }

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


function makeArray(o) {
  if (typeof o === 'string') return [o];
  if (Array.isArray(o)) return o;
  return [];
}


function normalizeEndSlash(from) {
  if (!/\/$/.test(from)) {
    from += '/';
  }
  return from;
}


module.exports = Install;
