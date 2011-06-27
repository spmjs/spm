// vim: set tabstop=2 shiftwidth=2:

/**
 * @fileoverview transport external modules to seajs compatible code.
 * @author yyfrankyy@gmail.com (Frank Xu)
 */

var undefined,
    fs = require('fs'),
    sysUtil = require('util'),
    path = require('path'),
    gzip = require('gzip'),
    util = require('../../util'),
    tspt = require('../tspt/parser'),
    factory = require('../lib/actionFactory'),
    extract = require('../lib/extract'),
    uglifyjs = require('uglify-js'),
    jsp = uglifyjs.parser.parse,
    pro = uglifyjs.uglify,
    message = require('../i18n/message'),
    registry = require('../web/registry'),
    CONFIG = require('../config');


/**
 * Transport Object.
 */
var Transport = factory.create(function() {
  var config = {
    force: false,
    gzip: true
  };

  for (var i in config) {
    this.config[i] = config[i];
  }

  this.options = {
    force: {
      alias: ['-f', '--force']
    },
    gzip: {
      alias: ['-g', '--gzip']
    }
  };
});


Transport.prototype.run = function(opts) {
  var self = this,
      opts = opts || {},
      mods = opts.mods || [],
      config = opts.config || {};

  for (var i in config) {
    this.config[i] = config[i];
  }

  if (mods.length === 0) {
    console.info('start building all modules..');
    fs.readdirSync(CONFIG.TRANSPORTS_DIR).forEach(function(tspt) {
      build(tspt.replace(/\.tspt$/, ''));
    });
  } else {
    mods.forEach(function(mod) {
      var tsptFile = path.join(CONFIG.TRANSPORTS_DIR, mod + '.tspt');
      if (path.existsSync(tsptFile)) {
        console.info('start building %s..', mod);
        self.transport(tsptFile);
      } else {
        console.warn('%s does not exist, ignore', tsptFile);
      }
    });
  }
};


/**
 * Start Transporting.
 */
Transport.prototype.transport = function(uri) {

  var self = this,
      config = self.config,
      tmpl = fs.readFileSync(uri).toString();

  tspt.parse(uri, function(o) {
    var meta = o.meta, stat, tmpl;

    meta.name = meta.name && meta.name.toLowerCase();
    meta.tags = meta.tags ? meta.tags.split(/\s*,\s*/) : (meta.keywords || []);

    if (meta.name === undefined) {
      console.error('meta infomation not enough');
      return;
    }

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
      console.warn(message.MODULE_EXISTS, src, meta.name);
      return;
    }

    if (config.force) {
      console.warn(message.USE_FORCE_MODE);
    }

    // use given source file
    if (meta.src) {
      util.readFromPath(meta.src, function(data) {
        handleResult(meta, tmpl, data, srcSuffix);

        console.info(
            message.BUILT_SOURCE_CODE,
            meta.name,
            fs.statSync(src).size);

        // minify
        if (!meta.min) {
          console.warn(message.BUILT_BY_UGLIFYJS, meta.name);

          var source = fs.readFileSync(src).toString(),
              minified = pro.gen_code(jsp(source));
          fs.writeFileSync(min, minified);
          updateMeta(meta, min);
          console.info(
              message.BUILT_MINIFIED_CODE,
              meta.name,
              fs.statSync(min).size);
        }
      });
    }

    // use given minified file
    if (meta.min) {
      util.readFromPath(meta.min, function(data) {
        handleResult(meta, tmpl, data, minSuffix);
        updateMeta(meta, min);
        console.info(message.BUILT_MINIFIED_CODE, meta.name, meta.size);
      });
    }
  });
};


/**
 * only publish version can be transported. or in force_mode.
 */
Transport.prototype.verifyVersion = function(version) {
  var config = this.config;
  if (config.force || /^\d+(\.\d+){2}(\.\d+)?$/.test(version))
    return true;
  console.warn(message.INVALID_VERSION_NUMBER, version);
  return false;
};


/**
 * custom completion.
 */
Transport.prototype.__defineGetter__('completion', function() {
  var completion = [];

  // return all options
  for (var i in this.options) {
    this.options[i].alias.forEach(function(opt) {
      completion.push(opt);
    });
  }

  fs.readdirSync(CONFIG.TRANSPORTS_DIR).forEach(function(tspt) {
    completion.push(tspt.replace(/\.tspt$/, ''));
  });

  return completion.join(' ');
});


/**
 * Transporting help.
 */
Transport.prototype.__defineGetter__('help', function() {
  var msg = message.TRANSPORT_HELP;
  if (!this.config.global) {
    msg += '\n' + message.TRANSPORT_HELP_OPTIONS;
  }
  return msg;
});

module.exports = Transport;

// prepare for modules/{name}/{version}/
function prepareDir(name, version) {
  util.mkdirSilent(CONFIG.MODULES_DIR);

  var modDir = path.join(CONFIG.MODULES_DIR, name);
  util.mkdirSilent(modDir);

  var verDir = path.join(modDir, version || CONFIG.DEFAULT_VERSION);
  util.mkdirSilent(verDir);

  return verDir;
}

// writing transported result
function handleResult(meta, tmpl, data, suffix) {
  data = tmpl.split(CONFIG.PLACEHOLDER).join(data);
  var dir = prepareDir(meta.name, meta.version),
      name = meta.filename || meta.name;

  // TODO
  // 因为uglifyjs的parser会丢失注释，利用tokenizer来做
  // https://github.com/ender-js/Ender/blob/master/lib/ender.file.js#L279
  var deps = extract.getAstDependencies(jsp(tmpl));
  data = data.replace(/define\s*\(/, function(match) {
    return match + JSON.stringify(deps) + ', ';
  });

  var outputPath = path.join(dir, name + suffix);
  fs.writeFileSync(outputPath, data);
}

// meta data stored meta infomation of all modules
var metaData = [];

// update meta infomation for webAPI
function updateMeta(meta, min) {
  var exists = false,
      stat = fs.statSync(min);
  meta.size = stat.size;

  // get gzip size
  gzip(fs.readFileSync(min), function(err, data) {

    if (err) {
      console.log(message.GZIP_NOT_SUPPORTED);
      return;
    }
    meta.gzipped = data.length;
    console.log('%s is gzipped, size: %s', meta.name, meta.gzipped);

    metaData.forEach(function(m, i) {
      if (m.name === meta.name) {
        metaData[i] = meta;
        exists = true;
      }
    });
    if (!exists)
      metaData.push(meta);

    console.log('update %s into data.js', meta.name);
    registry.generate(metaData);

  });
}
