var fs = require('fs'),
    path = require('path'),
    annotation = require('./annotation'),
    extract = require('../sbuild/extract'),
    uglifyjs = require('../../support/uglify-js/uglify-js'),
    jsp = uglifyjs.parser.parse,
    pro = uglifyjs.uglify,
    util = require('../util');

const PLACEHOLDER = '/*{{code}}*/';
const MODULES_DIR = 'modules';
const DEFAULT_VERSION = '1.0.0';

const ERRORS = {
    VERSION_EXISTS: function(src) {
        console.log('');
        console.log('    %s already exists, ignore.', src);
        console.log('    Update version information in the transport.js ');
        console.log('    if you want to upgrade to a new version.');
        console.log('');
    }
};

function parseTemplate(text) {
    var comments;
    var template;
    template = text.replace(/\/\*\*([\s\S]*?)\*\//g, function(all) {
        comments = all;
        return '';
    });
    return {
        meta: annotation.parse(comments),
        template: template
    };
}

function createProtocolHandler(name) {
  return function(addr, fn) {
    require(name).get(addr, function(res) {
      var buffer = '';
      res.on('data',
          function(chuck) {
            buffer += chuck.toString();
          }).on('end', function() {
            fn && fn(buffer);
          });
    });
  };
}
// all protocol handlers
var handlers = {
  http: createProtocolHandler('http'),
  https: createProtocolHandler('https')
};

function getData(addr, fn) {
    addr = require('url').parse(addr);
    addr.path = addr.pathname;

    var name = addr.protocol.slice(0, -1);
    if (handlers[name]) {
      console.log('    getting content from %s..', addr.href);
      handlers[name](addr, fn);
    }
    // handle other protocol.
    else {
        console.warn('   sorry for unsupported protocol %s.', addr.protocol);
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

function handleResult(meta, tmpl, data, suffix) {
    data = tmpl.split(PLACEHOLDER).join(data);
    var dir = prepareDir(meta.name, meta.version);

    // FIXME
    // 先如此处理depends
    // 因为uglifyjs的parser会丢失注释
    // 暂时没找到从ast重新输出正确包含依赖结构的方法
    // 另外出现部分模块不能通过uglify的parser抛异常
    var deps = extract.getDependencies(jsp(tmpl));
    data = data.replace(/define\s*\(/, function(match) {
        return match + JSON.stringify(deps) + ', ';
    });
    fs.writeFileSync(path.join(dir, meta.name + suffix), data);
}

function build(tmpl) {
    tmpl = fs.readFileSync(tmpl).toString();
    var o = parseTemplate(tmpl);
    var meta = o.meta;
    meta.name = meta.name.toLowerCase();
    tmpl = o.template;

    var srcSuffix = '-debug.js', minSuffix = '.js';

    var dir = prepareDir(meta.name, meta.version),
        src = path.join(dir, meta.name + srcSuffix),
        min = path.join(dir, meta.name + minSuffix);

    if (path.existsSync(src)) {
        ERRORS.VERSION_EXISTS(src);
        return;
    }

    if (meta.src) {
        getData(meta.src, function(data) {
            handleResult(meta, tmpl, data, srcSuffix);

            // minify
            if (!meta.min) {
                console.log(
                    '    %s has no minified source, use uglify to minify.',
                    meta.name
                );
                var source = fs.readFileSync(src).toString();
                fs.writeFileSync(min, pro.gen_code(jsp(source)));
            }
        });
    }

    if (meta.min) {
        getData(meta.min, function(data) {
            handleResult(meta, tmpl, data, minSuffix);
        });
    }
}

function buildAll() {

    console.log('');
    console.log('    start building all modules..');
    console.log('');

    var mods = fs.readdirSync(MODULES_DIR);
    mods.forEach(function(mod) {
        var tmpl = path.join(MODULES_DIR, mod, 'transport.js');
        if (path.existsSync(tmpl)) {
            console.log('');
            console.log('    found %s', tmpl);
            console.log('    building %s', mod);
            build(tmpl);
        } else {
            console.warn('    %s does not exist, ignore.', tmpl);
        }
    });

    console.log('');
    console.log('    done.');
    console.log('');
}

//exports.parseTemplate = parseTemplate;
//exports.getData = getData;
//exports.PLACEHOLDER = PLACEHOLDER;
//exports.prepareDir = prepareDir;
exports.build = build;
exports.buildAll = buildAll;

if (__filename.indexOf(process.argv[1]) === 0) {
  buildAll();
}
