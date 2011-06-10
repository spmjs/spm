// vim: set tabstop=2 shiftwidth=2:

/**
 * @fileoverview transport external modules to seajs compatible code.
 * @author yyfrankyy@gmail.com (Frank Xu)
 */

var fs = require('fs'),
    path = require('path'),
    url = require('url'),
    annotation = require('./annotation'),
    extract = require('../sbuild/extract'),
    uglifyjs = require('../../support/uglify-js/uglify-js'),
    jsp = uglifyjs.parser.parse,
    pro = uglifyjs.uglify,
    util = require('../util'),
    console = require('./log'),
    webAPI = require('./webAPI');

const PLACEHOLDER = '/*{{code}}*/';
const MODULES_DIR = 'modules';
const TRANSPORTS_DIR = 'transports';
const DEFAULT_VERSION = '1.0.0';
const VERSION_REGEXP = /^\d+(\.\d+){2}(\.\d+)?$/;

// in force mode, we will update all infomation, code.
exports.FORCE_MODE = false;

// meta data stored meta infomation of all modules
var metaData = [];

function parseTemplate(text, callback) {
  var comments, template;

  template = text.replace(/\/\*\*([\s\S]*?)\*\/\s*/g, function(all) {
    comments = all;
    return '\n';
  });

  var meta = annotation.parse(comments);

  // compatible for npm package.json
  if (meta['package']) {
    util.readFromPath(meta['package'], function(config) {
      try {
        config = JSON.parse(config);
      } catch (e) {
        config = {};
      }

      for (var i in config) {
        // priority: transport.js > package.json
        if (i in meta) continue;
        meta[i] = config[i];
      }

      callback({
        meta: meta,
        template: template
      });

    });
  }

  // all config from transport files
  else {
    callback({
      meta: meta,
      template: template
    });
  }
}

// prepare for modules/{name}/{version}/
function prepareDir(name, version) {
  util.mkdirSilent(MODULES_DIR);

  var modDir = path.join(MODULES_DIR, name);
  util.mkdirSilent(modDir);

  var verDir = path.join(modDir, version || DEFAULT_VERSION);
  util.mkdirSilent(verDir);

  return verDir;
}

// only publish version can be transported. or in force_mode
function verifyVersion(version) {
  if (exports.FORCE_MODE || VERSION_REGEXP.test(version))
    return true;
  console.warn('%s is not a valid publish version', version);
  console.warn('we use http://semver.org/ for validating version number');
  console.warn('you can use force mode to force build this unstable version');
  return false;
}

// writing transported result
function handleResult(meta, tmpl, data, suffix) {
  data = tmpl.split(PLACEHOLDER).join(data);
  var dir = prepareDir(meta.name, meta.version),
      name = meta.filename || meta.name;

  // FIXME
  // 因为uglifyjs的parser会丢失注释
  // 暂时没找到从ast重新输出正确包含依赖结构的方法
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

    if (!exports.FORCE_MODE && path.existsSync(src)) {
      console.warn('%s already exists, ignore', src);
      console.warn('update version information in your %s.tspt', meta.name);
      console.warn('or use force mode to update');
      updateMeta(meta, min);
      return;
    }

    if (exports.FORCE_MODE) {
      console.warn('we are using force mode');
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
          var source = fs.readFileSync(src).toString();
          fs.writeFileSync(min, pro.gen_code(jsp(source)));
          updateMeta(meta, min);
          console.info(
              '%s is minified, size: %s',
              meta.name, stat.size);
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
  if (!exports.FORCE_MODE) {
    process.stdout.write(console.colorize(
        'are you sure want to remove "' + mod + '"? [Yn]: ', 'warn'));
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
  fs.readdirSync(MODULES_DIR).forEach(build);
}

exports.build = build;
exports.remove = remove;
exports.parseTemplate = parseTemplate;
exports.buildAll = buildAll;
