// vim: set tabstop=2 shiftwidth=2:

/**
 * @fileoverview install seajs modules to somewhere.
 * @author yyfrankyy@gmail.com (Frank Xu)
 */

var factory = require('../lib/actionFactory'),
    CONFIG = require('../config'),
    uglifyjs = require('uglify-js'),
    fs = require('fs'),
    path = require('path'),
    message = require('../i18n/message'),
    jsp = uglifyjs.parser.parse,
    pro = uglifyjs.uglify,
    util = require('../../util');


var Install = factory.create(function() {
  var config = {
    force: false,
    seajs: ['sea.js', 'sea-debug.js']
  };

  for (var i in config) {
    this.config[i] = config[i];
  }

  this.options = {
    force: {
      alias: ['-f', '--force']
    },
    seajs: {
      alias: ['-s', '--seajs'],
      length: 1
    },
    min: {
      alias: ['-m', '--min']
    },
    debug: {
      alias: ['-d', '--debug']
    }
  };
});


Install.prototype.run = function(opts) {
  var self = this,
      opts = opts || {},
      mods = opts.mods || [],
      config = opts.config || {},
      seajses = self.config.seajs,
      seajs = '',
      suffixes = [];

  for (var i in config) {
    this.config[i] = config[i];
  }

  if (config.seajs) {
    seajses = config.seajs;
  }

  for (var i = 0, l = seajses.length; i < l; i++) {
    if (!path.existsSync(seajses[i])) continue;
    seajs = seajses[i];
    break;
  }

  if (path.existsSync(seajs)) {
    seajs = seajs.replace(/^(.*\/).*$/, '$1');
  } else {
    console.log(message.SEAJS_NOT_EXISTS);
    if (!self.config.force && mods.indexOf('seajs') === -1) return;
    console.log(message.FORCE_INSTALL, mods.join(' '));
    seajs = fs.realpathSync('.');
  }

  util.readFromPath(CONFIG.REMOTE + CONFIG.DATAFILE, function(data) {
    data = data.replace(/define\(([\s\S]+)\);/, '$1');
    try {
      data = JSON.parse(data);
    } catch (e) {
      data = [];
    }
    mods.forEach(function(mod) {

      if (path.existsSync(mod) && !self.config.force) {
        console.log('%s is exists, use force mode to reinstall it.', mod);
        return;
      }

      if (config.min) {
        suffixes = ['.js'];
      } else if (config.debug) {
        suffixes = ['-debug.js'];
      } else {
        suffixes = ['-debug.js', '.js'];
      }

      data.forEach(function(meta) {
        if (meta.name === mod) {
          install(meta, seajs, suffixes);
        }
      });

    });
  });
};


function install(meta, target, suffixes) {
  var mod = meta.name, version = meta.version;
  var remotefile = path.join('modules', mod, version, mod);

  suffixes.forEach(function(suffix) {
    var remote = CONFIG.REMOTE + remotefile + suffix,
        local = path.join(target, mod + suffix);
    util.download(remote, local, function() {
      console.log('Installed %s@%s at %s.', mod, version, local);
    });
  });
}


module.exports = Install;
