/**
 * @fileoverview spm install.
 * @author lifesinger@gmail.com (Frank Wang)
 */

var fs = require('fs');
var path = require('path');

var ActionFactory = require('./ActionFactory');
var fsExt = require('../utils/fsExt');


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
  var args = (this.args[0] || '').split('@');
  var name = args[0];

  var instance = this;
  callback || (callback = noop);

  // spm install
  if (!name) {
    console.log(MESSAGE.USAGE, '\n      ', MESSAGE.DESCRIPTION);
    callback({ errCode: -1 });
    return;
  }

  var options = this.options;
  options.from = normalizeEndSlash(options.from || CONFIG.FROM);
  console.log(MESSAGE.START);

  fsExt.readFromPath(options.from + 'registry.js', function(code) {
    code = code.replace('define({', '{').replace('});', '}');

    var registry = JSON.parse(code);
    var meta = registry[name];

    // spm install not-exists
    if (!meta) {
      console.log(MESSAGE.NOT_FOUND, name);
      callback({ errCode: -2 });
      return;
    }

    // spm install name
    meta.name = name;
    args[1] && (meta.version = args[1]);
    meta.filename || (meta.filename = name);

    var BASE = instance.options.from +
        path.join(name, meta.version, meta.filename);

    meta.minpath = BASE + '.js';
    meta.srcpath = BASE + '-debug.js';

    instance.install(meta, callback);
  });
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

  fsExt.readFromPath(meta.minpath, function(code) {
    fs.writeFileSync(meta.localminpath, code, 'utf8');
    done();
  });

  fsExt.readFromPath(meta.srcpath, function(code) {
    fs.writeFileSync(meta.localsrcpath, code, 'utf8');
    done();
  });

  function done() {
    if (done.executed) return;
    done.executed = true;
    console.log(MESSAGE.SUCCESS, meta.name, meta.version);
    callback({ 'meta': meta });
  }
};


function noop() {

}


function normalizeEndSlash(from) {
  if (!/\/$/.test(from)) {
    from += '/';
  }
  return from;
}


module.exports = Install;
