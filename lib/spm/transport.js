// vim: set tabstop=2 shiftwidth=2:

require('./log');

var fs = require('fs'),
    path = require('path'),
    url = require('url'),
    annotation = require('./annotation'),
    extract = require('../sbuild/extract'),
    uglifyjs = require('../../support/uglify-js/uglify-js'),
    jsp = uglifyjs.parser.parse,
    pro = uglifyjs.uglify,
    util = require('../util');

const PLACEHOLDER = '/*{{code}}*/';
const MODULES_DIR = 'modules';
const DEFAULT_VERSION = '1.0.0';

function parseTemplate(text, callback) {
  var comments, template;

  template = text.replace(/\/\*\*([\s\S]*?)\*\//g, function(all) {
    comments = all;
    return '';
  });

  var meta = annotation.parse(comments);

  // compatible for npm package.json
  if (meta.package) {
    util.readFromPath(meta.package, function(config) {
      config = JSON.parse(config);

      for (var i in config) {
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
  console.log(modDir);

  var verDir = path.join(modDir, version || DEFAULT_VERSION);
  util.mkdirSilent(verDir);

  return verDir;
}

function handleResult(meta, tmpl, data, suffix) {
  data = tmpl.split(PLACEHOLDER).join(data);
  var dir = prepareDir(meta.name, meta.version);

  // FIXME
  // 先如此处理depends
  // 因为uglifyjs的parser会丢失注释
  // 暂时没找到从ast重新输出正确包含依赖结构的方法
  // 另外出现部分模块不能通过uglify的parser抛异常
  var deps = extract.getAstDependencies(jsp(tmpl));
  data = data.replace(/define\s*\(/, function(match) {
    return match + JSON.stringify(deps) + ', ';
  });
  fs.writeFileSync(path.join(dir, meta.name + suffix), data);
}

function _build(tmpl) {

  tmpl = fs.readFileSync(tmpl).toString();

  parseTemplate(tmpl, function(o) {
    var meta = o.meta;
    meta.name = meta.name.toLowerCase();
    tmpl = o.template;

    var srcSuffix = '-debug.js', minSuffix = '.js';

    var dir = prepareDir(meta.name, meta.version),
        src = path.join(dir, meta.name + srcSuffix),
        min = path.join(dir, meta.name + minSuffix);

    if (path.existsSync(src)) {
      console.log('');
      console.log('%s already exists, ignore.', src);
      console.log('Update version information in the transport.js ');
      console.log('if you want to upgrade to a new version.');
      console.log('');
      return;
    }
    console.dir(meta);

    if (meta.src) {
      util.readFromPath(meta.src, function(data) {
        handleResult(meta, tmpl, data, srcSuffix);

        // minify
        if (!meta.min) {
          console.log(
              '%s has no minified source, use uglify to minify.',
              meta.name
          );
          var source = fs.readFileSync(src).toString();
          fs.writeFileSync(min, pro.gen_code(jsp(source)));
        }
      });
    }

    if (meta.min) {
      util.readFromPath(meta.min, function(data) {
        handleResult(meta, tmpl, data, minSuffix);
      });
    }
  });
}

function build(mod) {
  var tmpl = path.join(MODULES_DIR, mod, 'transport.js');
  console.log(tmpl);
  if (path.existsSync(tmpl)) {
    console.log('');
    console.log('found %s', tmpl);
    console.log('building %s', mod);
    _build(tmpl);
  } else {
    console.warn('%s does not exist, ignore.', tmpl);
  }
}

function buildAll() {
  console.warn('start building all modules..');
  fs.readdirSync(MODULES_DIR).forEach(build);
}

exports.build = build;
exports.buildAll = buildAll;

if (process.argv[2]) {
  build(process.argv[2]);
} else if (__filename.indexOf(process.argv[1]) === 0) {
  buildAll();
}
