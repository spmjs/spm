// vim: set tabstop=2 shiftwidth=2:

/**
 * @fileoverview transport external modules to seajs compatible code.
 * @author yyfrankyy@gmail.com (Frank Xu)
 */

var fs = require('fs'),
    sysUtil = require('util'),
    util = require('../../util'),
    tspt = require('../tspt/parser'),
    events = require('events'),
    msg = require('../i18n/message');


/**
 * Transport Object.
 * @param {Object} [config] config of transporting.
 */
var Transport = function(config) {
  events.EventEmitter.call(this);
  this.config = config || {
    force: false,
    gzip: true
  };
};

sysUtil.inherits(Transport, events.EventEmitter);


/**
 * Start Transporting.
 */
Transport.prototype.run = function(tmpl) {

  var self = this, config = self.config;

  tmpl = fs.readFileSync(tmpl).toString();

  tspt.parse(tmpl, function(o) {
    var meta = o.meta, stat, tmpl;

    meta.tags = meta.tags ? meta.tags.split(/\s*,\s*/) : (meta.keywords || []);
    meta.name = meta.name.toLowerCase();
    tmpl = o.template;

    // unstable version or invalid version number
    if (!self.verifyVersion(meta.version))
      return;

    var srcSuffix = '-debug.js', minSuffix = '.js',
        name = meta.filename || meta.name;

    var dir = prepareDir(meta.name, meta.version),
        src = path.join(dir, name + srcSuffix),
        min = path.join(dir, name + minSuffix);

    if (!config.force && path.existsSync(src)) {
      console.warn(msg.MODULE_NOT_EXISTS, src, meta.name);

      this.emit('meta', {
        meta: meta,
        min: min
      });
      return;
    }

    if (config.force) {
      console.warn(msg.USE_FORCE_MODE);
    }

    // use given source file
    if (meta.src) {
      util.readFromPath(meta.src, function(data) {
        handleResult(meta, tmpl, data, srcSuffix);

        console.info(
            msg.BUILT_SOURCE_CODE,
            meta.name,
            fs.statSync(src).size);

        // minify
        if (!meta.min) {
          console.warn(msg.BUILT_BY_UGLIFYJS, meta.name);
          var source = fs.readFileSync(src).toString(),
              minified = pro.gen_code(jsp(source));
          fs.writeFileSync(min, minified);

          this.emit('meta', {
            meta: meta,
            min: min
          });

          console.info(
              msg.BUILT_MINIFIED_CODE,
              meta.name,
              fs.statSync(min).size);
        }
      });
    }

    // use given minified file
    if (meta.min) {
      util.readFromPath(meta.min, function(data) {
        handleResult(meta, tmpl, data, minSuffix);

        this.emit('meta', {
          meta: meta,
          min: min
        });

        console.info(msg.BUILT_MINIFIED_CODE, meta.name, meta.size);
      });
    }
  });
};


/**
 * only publish version can be transported. or in force_mode.
 */
Transport.prototype.verifyVersion = function(tmpl) {
  var config = this.config;
  if (config.force || /^\d+(\.\d+){2}(\.\d+)?$/.test(version))
    return true;
  console.warn(msg.INVALID_VERSION_NUMBER, version);
  return false;
};


/**
 * Transporting help.
 */
Transport.prototype.help = function() {
};

module.exports = Transport;
