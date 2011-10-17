/**
 * @fileoverview spm transport path/to/transport.js
 * @author lifesinger@gmail.com (Frank Wang)
 */

var fs = require('fs');
var path = require('path');

var ActionFactory = require('./ActionFactory');
var fsExt = require('../utils/fsExt');
var Annotation = require('../utils/Annotation');
var Compressor = require('../utils/Compressor');


var Transport = ActionFactory.create('Transport');


Transport.AVAILABLE_OPTIONS = {
  force: {
    alias: ['--force', '-f'],
    description: 'Override existing files.'
  }
};


Transport.CONFIG = {
  PLACE_HOLDER: '/*{{code}}*/'
};


Transport.MESSAGE = {
  USAGE: 'Usage: spm transport path/to/transport.js [--force]',

  DESCRIPTION: 'Transport a module.',

  START: 'Start transporting',

  NOT_FOUND: '\nNo such file: %s\n',

  META_INVALID: 'The meta object must have this property: ',

  ALREADY_EXISTS: '\nError: %s already exists.\n' +
      '       If you want to override it, please turn on --force option.\n',

  SUCCESS: 'Transported to %s\n'
};


var CONFIG = Transport.CONFIG;
var MESSAGE = Transport.MESSAGE;


Transport.prototype.run = function(config) {
  var transportFile = this.args[0];
  config || (config = {});

  // spm transport
  if (!transportFile) {
    console.log(MESSAGE.USAGE, '\n      ', MESSAGE.DESCRIPTION);
    return -1;
  }

  // spm transport not-exists
  transportFile = path.resolve(transportFile);

  if (!path.existsSync(transportFile)) {
    console.log(MESSAGE.NOT_FOUND, transportFile);
    return -2;
  }

  // spm transport path/to/transport.js
  this.transport(transportFile, config['callback']);
};


Transport.prototype.transport = function(transportFile, callback) {
  console.log(MESSAGE.START);
  var options = this.options;

  getMeta(transportFile, function(meta) {
    checkMetaIsValid(meta);

    var dir = path.dirname(transportFile);
    dir = path.join(dir, meta['version']);
    fsExt.mkdirS(dir);

    var name = meta['name'].toLowerCase();
    var srcOutputFile = path.join(dir, name + '-debug.js');

    if (path.existsSync(srcOutputFile) && !options.force) {
      console.warn(MESSAGE.ALREADY_EXISTS, path.basename(srcOutputFile));
      return;
    }

    var minOutputFile = srcOutputFile.replace('-debug', '');
    var tmpl = getTemplate(transportFile);

    transport(meta['src'], srcOutputFile, tmpl, function() {
      if (meta['min']) {
        transport(meta['min'], minOutputFile, tmpl, done);
      }
      else {
        Compressor.compress(srcOutputFile, minOutputFile);
        done();
      }
    });

    function done() {
      // for unit test etc.
      callback && callback({
        'meta': meta,
        'tmpl': tmpl,
        'srcOutputFile': srcOutputFile,
        'minOutputFile': minOutputFile
      });

      console.log(MESSAGE.SUCCESS, path.dirname(srcOutputFile));
    }
  });
};


function getMeta(filepath, callback) {
  var meta = Annotation.parse(filepath);
  normalizePath(meta, filepath);

  var packageFile = meta['package'];

  if (packageFile) {
    fsExt.readFromPath(packageFile, function(json) {
      json = JSON.parse(json);

      for (var p in json) {
        // priority: transport.js > package.json
        if (json.hasOwnProperty(p) && !meta.hasOwnProperty(p)) {
          meta[p] = json[p];
        }
      }

      callback(meta);
    });
  }

  return meta;
}


function getTemplate(filepath) {
  var template = fs.readFileSync(filepath, 'utf8');
  template = template.replace(/\/\*([\s\S]*?)\*\/\s*/, '');
  return template;
}


function checkMetaIsValid(meta) {
  ['name', 'version', 'src'].forEach(function(p) {
    if (!meta.hasOwnProperty(p)) {
      console.dir(meta);
      throw MESSAGE.META_INVALID + p;
    }
  });
}


function transport(inputFile, outputFile, template, callback) {
  fsExt.readFromPath(inputFile, function(code) {
    code = template.split(CONFIG.PLACE_HOLDER).join(code);
    fs.writeFileSync(outputFile, code, 'utf8');
    callback();
  });
}


function normalizePath(meta, transportFile) {
  ['package', 'src', 'min'].forEach(function(p) {
    if (meta[p] && !/^https?:/.test(meta[p])) {
      meta[p] = path.join(path.dirname(transportFile), meta[p]);
    }
  });
}


module.exports = Transport;
