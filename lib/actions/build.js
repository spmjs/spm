// vim: set tabstop=2 shiftwidth=2:

/**
 * @fileoverview spm build (port from sbuild).
 * @author lifesinger@gmail.com (Frank Wang), yyfrankyy@gmail.com (Frank Xu)
 */

var fs = require('fs');
var path = require('path');

var util = require('../helper/util');
var extract = require('../helper/extract');
var alias = require('../helper/alias');
var combo = require('./build/combo');
var createAction = require('./action_factory');


var Build = createAction('build');


Build.prototype.AVAILABLE_OPTIONS = {
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


Build.prototype.run = function() {
  var config = this.config;
  var options = config.options;

  // spm build --clear
  if (options.clear) {
    require('./build/clear').run();
    return;
  }


  // spm build module1 module2 --config app-config.js
  var modules = config.modules;
  build(modules, options.configFile[0]);

  function build(names, basedir, configFile) {
    basedir = basedir || process.cwd();
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


module.exports = Build;
