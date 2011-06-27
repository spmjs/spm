// vim: set tabstop=2 shiftwidth=2:

/**
 * @fileoverview spm build (port from sbuild).
 * @author lifesinger@gmail.com (Frank Wang), yyfrankyy@gmail.com (Frank Xu)
 */


var fs = require('fs');
var path = require('path');

var factory = require('../lib/actionFactory');
var util = require('../../util');
var extract = require('../lib/extract');
var alias = require('../lib/alias');
var combo = require('./build/combo');
var message = require('../i18n/message');


var Build = factory.create(function() {
  this.options = {
    clear: {
      alias: ['--clear']
    },
    combo: {
      alias: ['--combo']
    },
    comboAll: {
      alias: ['--comboAll']
    },
    configFile: {
      alias: ['--config'],
      length: 1
    },
    recursive: {
      alias: ['-r', '--recursive']
    }
  };
});

Build.prototype.run = function(opts) {
  var self = this,
      opts = opts || {},
      mods = opts.mods || [],
      config = opts.config || {};

  if (config.clear) {
    require('./build/clear').run(process.cwd());
    return;
  }

  configFile = alias.getConfigFile(mods[0], config.configFile);
  build(mods, process.cwd(), config.configFile);

  function build(names, basedir, configFile) {
    names.forEach(function(name) {

      var p = util.normalize(name, basedir);
      var stat = fs.statSync(p);

      if (p.indexOf('.') !== 0 && stat.isFile()) {
        buildFile(p, configFile);
      }
      else if (config.recursive &&
          p.indexOf('__build') === -1 &&
          stat.isDirectory()) {
        build(fs.readdirSync(p), p);
      }

    });
  }

  function buildFile(filepath, configFile) {
    if (config.combo || config.comboAll) {
      combo.run(filepath, 'auto', config.comboAll, configFile);
    }
    else {
      var outfile = extract.run(filepath, 'auto', { 'compress': true });
      console.log('Successfully build to ' + util.getRelativePath(outfile));
    }
  }
};


Build.prototype.__defineGetter__('help', function() {
  var o = message.BUILD_HELP;
  if (!this.config.global) {
    o += '\n' + message.BUILD_HELP_OPTIONS;
  }
  return o;
});


module.exports = Build;

// node sbuild [--combo] [-r] a.js b.js [--config path/to/app-config.js]
