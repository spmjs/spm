/**
 * @fileoverview spm transport path/to/transport.js
 * @author lifesinger@gmail.com (Frank Wang)
 */

var fs = require('fs');
var path = require('path');

var ActionFactory = require('./ActionFactory');
var fsExt = require('../utils/fsExt');
var Annotation = require('../utils/Annotation');


var Transport = ActionFactory.create('Transport');


Transport.AVAILABLE_OPTIONS = {
  force: {
    alias: ['--force', '-f']
  }
};


Transport.MESSAGE = {
  USAGE: 'usage: spm transport path/to/transport.js --force\n       transport a module',
  NOT_FOUND: 'No such module: %s',
  META_INVALID: 'meta must have this property: ',
  ALREADY_EXISTS: '%s already exists. Please use --force option to override it.'
};


var MESSAGE = Transport.MESSAGE;


Transport.prototype.run = function() {
  var transportFile = this.args[0];
  var MESSAGE = this.MESSAGE;

  // spm transport
  if (!transportFile) {
    console.log(MESSAGE.USAGE);
    return;
  }

  // spm transport not-exists
  transportFile = path.resolve(transportFile);

  if (!path.existsSync(transportFile)) {
    console.log(MESSAGE.NOT_FOUND, transportFile);
    return;
  }

  // spm transport path/to/transport.js
  this.transport(transportFile);
};


Transport.prototype.transport = function(transportFile) {
  var meta = this.getMeta(transportFile);
  this.checkMetaIsValid(meta);

  var dir = path.dirname(transportFile);
  dir = path.join(dir, meta['version']);
  fsExt.mkdirS(dir);

  var srcOutputFile = path.join(dir, name + '-debug.js');
  var minOutputFile = path.join(dir, name + '.js');

  if (path.existsSync(srcOutputFile) && !this.options.force) {
    console.warn(this.MESSAGE.ALREADY_EXISTS, srcOutputFile);
    return;
  }

  fsExt.readFromPath(meta['src'], function(code) {
    var tmpl = this.getTemplate(transportFile);
    code = tmpl.replace()
  });


};


Transport.prototype.getMeta = function(filepath) {
  var meta = Annotation.parse(filepath);
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
    });
  }

  return meta;
};


Transport.prototype.getTemplate = function(filepath) {
  var template = fs.readFileSync(filepath, 'utf-8');
  template = template.replace(/\/\*([\s\S]*?)\*\/\s*/, '');
  return template;
};


Transport.prototype.checkMetaIsValid = function(meta) {
  ['name', 'version', 'src'].forEach(function(p) {
    if (!meta.hasOwnProperty(p)) {
      throw this.MESSAGE.META_INVALID + p;
    }
  });
};


module.exports = Transport;
