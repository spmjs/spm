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
  }
};


Install.MESSAGE = {
  USAGE: 'Usage: spm install name[@version]',

  DESCRIPTION: 'Install a module.',

  NOT_FOUND: 'No such module: %s'
};


Install.CONFIG = {
  MODULES_PATH: 'http://modules.seajs.com/',
  REGISTRY: 'http://modules.seajs.com/registry.js'
};


var MESSAGE = Install.MESSAGE;
var CONFIG = Install.CONFIG;


Install.prototype.run = function() {
  var args = (this.args[0] || '').split('@');
  var name = args[0];

  if (!name) {
    console.log(MESSAGE.USAGE, '\n      ', MESSAGE.DESCRIPTION);
    return -1;
  }

  fsExt.readFromPath(CONFIG.REGISTRY, function(code) {
    code = code.replace('define({', '{').replace('});', '}');

    var registry = JSON.parse(code);
    var meta = registry[name];

    if (!meta) {
      console.log(MESSAGE.NOT_FOUND, name);
      return;
    }

    meta.name = name;
    args[1] && (meta.version = args[1]);
    meta.filename || (meta.filename = name);

    var BASE = path.join(CONFIG.MODULES_PATH, name, meta.version, meta.filename);
    meta.minpath = BASE + '.js';
    meta.srcpath = BASE + '-debug.js';

    this.install(meta);
  });
};


Install.prototype.install = function(meta) {
  var installPath = path.resolve(path.join(meta.name, meta.version));
  fsExt.mkdirS(installPath);

};


module.exports = Install;
