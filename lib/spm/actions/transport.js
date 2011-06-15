// vim: set tabstop=2 shiftwidth=2:

/**
 * @fileoverview transport external modules to seajs compatible code.
 * @author yyfrankyy@gmail.com (Frank Xu)
 */

var fs = require('fs'),
    path = require('path'),
    url = require('url'),
    extract = require('../../sbuild/extract'),
    uglifyjs = require('uglify-js'),
    jsp = uglifyjs.parser.parse,
    pro = uglifyjs.uglify,
    util = require('../../util'),
    webAPI = require('../web/api'),
    help = require('../help'),
    gzip = require('gzip'),
    parseTemplate = require('../tspt/parser').parse;

const PLACEHOLDER = '/*{{code}}*/';
const MODULES_DIR = 'modules';
const TRANSPORTS_DIR = 'transports';
const DEFAULT_VERSION = '1.0.0';

// in force mode, we will update all infomation, code.
var config = {
  force: false,
  gzip: true
};

// meta data stored meta infomation of all modules
var metaData = [];

// prepare for modules/{name}/{version}/
function prepareDir(name, version) {
  util.mkdirSilent(MODULES_DIR);

  var modDir = path.join(MODULES_DIR, name);
  util.mkdirSilent(modDir);

  var verDir = path.join(modDir, version || DEFAULT_VERSION);
  util.mkdirSilent(verDir);

  return verDir;
}

// writing transported result
function handleResult(meta, tmpl, data, suffix) {
  data = tmpl.split(PLACEHOLDER).join(data);
  var dir = prepareDir(meta.name, meta.version),
      name = meta.filename || meta.name;

  // FIXME
  // 因为uglifyjs的parser会丢失注释
  // 暂时没找到从ast重新输出正确包含依赖结构的方法
  // https://github.com/ender-js/Ender/blob/master/lib/ender.file.js#L279
  // 看起来似乎可以解决
  var deps = extract.getAstDependencies(jsp(tmpl));
  data = data.replace(/define\s*\(/, function(match) {
    return match + JSON.stringify(deps) + ', ';
  });

  var outputPath = path.join(dir, name + suffix);
  fs.writeFileSync(outputPath, data);
}

// update meta infomation for webAPI
function updateMeta(meta, min) {
  var exists = false,
      stat = fs.statSync(min);
  meta.size = stat.size;

  // get gzip size
  gzip(fs.readFileSync(min), function(err, data) {

    if (err) {
      help.gzip();
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

    console.info('update %s into data.js', meta.name);
    webAPI.generate(metaData);

  });
}

// transporting
function transport(tmpl) {

  tmpl = fs.readFileSync(tmpl).toString();

  parseTemplate(tmpl, function(o) {
    var meta = o.meta, stat, tmpl;

    meta.tags = meta.tags ? meta.tags.split(/\s*,\s*/) : (meta.keywords || []);
    meta.name = meta.name.toLowerCase();
    tmpl = o.template;

    // unstable version or invalid version number
    if (!verifyVersion(meta.version))
      return;

    var srcSuffix = '-debug.js', minSuffix = '.js',
        name = meta.filename || meta.name;

    var dir = prepareDir(meta.name, meta.version),
        src = path.join(dir, name + srcSuffix),
        min = path.join(dir, name + minSuffix);

    if (!config.force && path.existsSync(src)) {
      help.moduleExists(src, meta.name);
      updateMeta(meta, min);
      return;
    }

    if (config.force) {
      console.warn('using force mode');
    }

    // use given source file
    if (meta.src) {
      util.readFromPath(meta.src, function(data) {
        handleResult(meta, tmpl, data, srcSuffix);
        console.info(
            'built %s source code. size: %s',
            meta.name, fs.statSync(src).size);

        // minify
        if (!meta.min) {
          console.warn(
              'there is no minified link at %s, minifing by UglifyJS',
              meta.name);
          var source = fs.readFileSync(src).toString(),
              minified = pro.gen_code(jsp(source));
          fs.writeFileSync(min, minified);
          updateMeta(meta, min);
          console.info(
              '%s is minified, size: %s',
              meta.name, fs.statSync(min).size);
        }
      });
    }

    // use given minified file
    if (meta.min) {
      util.readFromPath(meta.min, function(data) {
        handleResult(meta, tmpl, data, minSuffix);
        updateMeta(meta, min);
        console.info(
            'built %s minified code. size: %s',
            meta.name, meta.size);
      });
    }
  });
}

function remove(mod, version) {
  if (!config.force) {
    process.stdout.write('are you sure want to remove "' + mod + '"? [Yn]: ');
    process.stdin.resume();
    process.stdin.on('keypress', function(char, key) {
      if (key && key.name == 'y') {
        util.rmdirForce(path.join(MODULES_DIR, mod, version || ''));
        webAPI.remove(mod);
        console.info('%s have been removed successfully', mod);
        process.exit();
      } else {
        process.exit();
      }
    });
  } else {
    util.rmdirForce(path.join(MODULES_DIR, mod, version || ''));
    webAPI.remove(mod);
    console.info('%s have been removed successfully (force mode)', mod);
  }
}

function build(mod) {
  var tmpl = path.join(TRANSPORTS_DIR, mod + '.tspt');
  if (path.existsSync(tmpl)) {
    console.info('start building %s..', mod);
    transport(tmpl);
  } else {
    console.warn('%s does not exist, ignore', tmpl);
  }
}

function buildAll() {
  console.info('start building all modules..');
  fs.readdirSync(TRANSPORTS_DIR).forEach(function(tspt) {
    build(tspt.replace(/\.tspt$/, ''));
  });
}

exports.config = function(o) {
  for (var i in o) {
    if (i in config) {
      config[i] = o[i];
    }
  }
};

exports.build = build;
exports.remove = remove;
exports.parseTemplate = parseTemplate;
exports.buildAll = buildAll;
