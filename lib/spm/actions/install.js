// vim: set tabstop=2 shiftwidth=2:

/**
 * @fileoverview spm install.
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
    extract = require('../lib/extract'),
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
    from: {
      alias: ['--from'],
      length: 1
    },
    min: {
      alias: ['-m', '--min']
    },
    debug: {
      alias: ['-d', '--debug']
    }
  };

  this.depth = 0;

  this.queried = {};
});


Install.prototype.run = function(opts) {
  var self = this,
      opts = opts || {},
      mods = opts.mods || [],
      config = opts.config || {},
      seajses = self.config.seajs,
      seajs = '',
      suffixes = [];

  if (config.from && config.from[0]) {
    var deps = getDeps(config.from[0]);
    deps.forEach(function(m) {
      if (mods.indexOf(m) === -1) {
        mods.push(m);
      }
    });
  }

  if (mods == []) {
    return;
  }

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
    seajs = fs.realpathSync(seajs).replace(/^(.*\/).*$/, '$1');
  } else {
    if (!self.config.force && mods.indexOf('seajs') === -1) {
      return;
      console.log(message.SEAJS_NOT_EXISTS);
    }
    seajs = fs.realpathSync('.');
  }

  util.readFromPath(CONFIG.REGISTRY, function(data) {
    data = data.replace(/define\(([\s\S]+)\);/, '$1');
    try {
      data = JSON.parse(data);
    } catch (e) {
      data = [];
    }
    mods.forEach(function(mod) {

      if (mod in self.queried) return;
      self.queried[mod] = true;

      if (path.existsSync(mod) && !self.config.force) {
        console.log('%s exists, use "--force" to reinstall it.', mod);
        return;
      }

      //if (config.min) {
      //  suffixes = ['.js'];
      //} else if (config.debug) {
      //  suffixes = ['-debug.js'];
      //} else {
      suffixes = ['-debug.js', '.js'];
      //}

      if (mod in data) {
        //install(data[mod], seajs, suffixes);
        var meta = data[mod], target = seajs,
            name = meta.filename || meta.name, version = meta.version,
            remotefile = CONFIG.SPMSERVER + path.join(meta.name, version, name);

        suffixes.forEach(function(suffix) {
          var remote = remotefile + suffix,
              //local = path.join(target, mod, version, mod + suffix);
              local = path.join(target, name + suffix);

          //util.mkdirSilent(path.join(target, mod));
          //util.mkdirSilent(path.join(target, mod, version));

          util.download(remote, local, function(e) {
            var depth = self.depth, depthChar = depth == 0 ? '' : '|-';
            while (deps--) {
              depthChar = ' ' + depthChar;
            }

            //console.log('Installed %s@%s at %s.', mod, version, local);
            console.log('%s%s@%s -> %s.',
                depthChar,
                name.cyan,
                version,
                local.yellow);

            if (suffix === '-debug.js') {
              var deps = getDeps(local);
              if (deps.length == 0) return;
              self.depth++;
              self.run({
                config: opts.config,
                mods: deps
              });
            }
          });
        });
      }

    });
  });
};


function getDeps(file) {
  var source = fs.readFileSync(fs.realpathSync(file)).toString();
  var deps = extract.getAstDependencies(jsp(source));
  return deps;
}


module.exports = Install;
