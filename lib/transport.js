var fs = require('fs'), path = require('path'),
    annotation = require('./annotation'),
    extract = require('./extract'),
    uglifyjs = require('../support/uglify-js/uglify-js'),
    jsp = uglifyjs.parser.parse,
    pro = uglifyjs.uglify,
    util = require('./util');

const PLACEHOLDER = '/*{{code}}*/';
const MODULES_DIR = 'modules';
const DEFAULT_VERSION = '1.0.0';

const ERRORS = {
    VERSION_EXISTS: function(src) {
        console.log('');
        console.log('    %s was already exist, ignore.', src);
        console.log('    if you want to upgrade your file to an new version.');
        console.log('    update your transport.js version infomation.');
        console.log('');
    }
};

function parseTemplate(text) {
    var comments, started = false, code = [],
        template = text.split(/\n|\r/);
    template = text.replace(/\/\*\*([\s\S]*?)\*\//g, function(all, cmt) {
        comments = all;
        return '';
    });
    return {
        meta: annotation.parse(comments),
        template: template
    };
}

// all protocol handlers
var handlers = {
    http: function(addr, fn) {
        require('http').get(addr, function(res) {
            var buffer = '';
            res.on('data', function(chuck) {
                buffer += chuck.toString();
            }).on('end', function() {
                fn && fn(buffer);
            });
        });
    }
};

function getData(addr, fn) {
    addr = require('url').parse(addr);
    addr.path = addr.pathname;

    var buffer = '';
    if (addr.protocol === 'http:') {
        console.log('    getting content from %s..', addr.href);
        handlers.http(addr, fn);
    }

    // handle other protocol.
    else {
        //
    }
}

// prepare for modules/{name}/{version}/
function prepareDir(mods, version) {
    var modDir = MODULES_DIR + '/' + mods,
        verDir = modDir + '/' + version;
    if (!path.existsSync(modDir)) {
        fs.mkdirSync(modDir, '0755');
    }
    if (!version) version = DEFAULT_VERSION;
    if (version && !path.existsSync(verDir)) {
        fs.mkdirSync(verDir, '0755');
    }
    return verDir;
}

function handleResult(meta, templ, data, suffix) {
    data = templ.replace(PLACEHOLDER, data);
    var dir = prepareDir(meta.name, meta.version) + '/';

    // FIXME
    // 先如此处理depends
    // 因为uglifyjs的parser会丢失注释
    // 暂时没找到从ast重新输出正确包含依赖结构的方法
    // 另外出现部分模块不能通过uglify的parser抛异常
    var deps = extract.getDependencies(jsp(templ));
    data = data.replace(/define\s*\(/, function(match) {
        return match + JSON.stringify(deps) + ', ';
    });
    fs.writeFileSync(dir + meta.name + suffix, data);
}

function build(templ) {
    var o = parseTemplate(templ),
        meta = o.meta,
        templ = o.template;

    var srcSuffix = '-debug.js', minSuffix = '.js';

    var dir = prepareDir(meta.name, meta.version) + '/',
        src = dir + meta.name + srcSuffix,
        min = dir + meta.name + minSuffix;

    if (path.existsSync(src)) {
        ERRORS.VERSION_EXISTS(src);
        return;
    }

    if (meta.src && meta.src.length !== 0) {
        getData(meta.src[0], function(data) {
            handleResult(meta, templ, data, srcSuffix);

            // minify
            if (!meta.min || meta.min.length === 0) {
                console.log('    %s has no minify source, use uglify to minify..', meta.name);
                var uglify = require('../support/uglify-js/uglify-js'),
                    jsp = uglify.parser.parse;
                    pro = uglify.uglify,
                    source = fs.readFileSync(src).toString();
                fs.writeFileSync(min, pro.gen_code(jsp(source)));
            }
        });
    }

    if (meta.min && meta.min.length !== 0) {
        getData(meta.min[0], function(data) {
            handleResult(meta, templ, data, minSuffix);
        });
    }
}

function buildAll() {

    console.log('');
    console.log('    start build all modules..');
    console.log('');

    var mods = fs.readdirSync(MODULES_DIR);
    mods.forEach(function(mod) {
        var templ = MODULES_DIR + '/' + mod + '/' + 'transport.js';
        if (path.existsSync(templ)) {
            console.log('');
            console.log('    found %s', templ);
            console.log('    building %s', mod);
            build(fs.readFileSync(templ).toString());
        } else {
            console.log('    %s not exists, ignore.', templ);
        }
    });

    console.log('');
    console.log('    done.');
    console.log('');
}

(function(exp) {
    if (!exp) return;
    exp.parseTemplate = parseTemplate;
    exp.getData = getData;
    exp.PLACEHOLDER = PLACEHOLDER;
    exp.prepareDir = prepareDir;
    exp.build = build;
})(exports);

buildAll();
