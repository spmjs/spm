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
    seajs = config.seajs[0];
  } else {
    for (var i = 0, l = seajses.length; i < l; i++) {
      if (path.existsSync(seajses[i])) {
        seajs = seajses[i];
        break;
      }
    }
  }

  if (path.existsSync(seajs)) {
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

        seajs = seajs.replace(/^(.*\/).*$/, '$1');

        data.forEach(function(meta) {
          if (meta.name === mod) {
            install(
                meta.name,
                meta.version,
                seajs,
                suffixes
            );
          }
        });

      });
    });
    return;
  }

  console.log(message.SEAJS_NOT_EXISTS);
};


function install(mod, version, target, suffixes) {
  // console.log('Installing %s', path.join(target, mod));
  var remotefile = path.join('modules', mod, version, mod);
  suffixes.forEach(function(suffix) {
    var remote = CONFIG.REMOTE + remotefile + suffix,
        local = path.join(target, mod + suffix);
    util.download(remote, local, function() {
      console.log('Installed %s.', local);
    });
  });
}


module.exports = Install;
