var fs = require('fs'), path = require('path'),
    annotation = require('./annotation');

const PLACEHOLDER = '/*{{code}}*/';
const MODULES_DIR = 'modules';
const DEFAULT_VERSION = '1.0.0';

function parseTemplate(text) {
    var comments, started = false, code = [],
        template = text.split(/\n|\r/);
    template = text.replace(/\/\*\*([\s\S]*?)\*\//g, function(all, cmt) {
        comments = all;
        return '';
    });
    // console.log(content);
    // console.log(comments);
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
        console.log('getting content from %s..', addr.href);
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
    fs.writeFileSync(dir + meta.name + suffix, data);
}

function build(templ) {
    var o = parseTemplate(templ),
        meta = o.meta,
        templ = o.template;
    console.log(meta);

    var srcSuffix = '-debug.js', minSuffix = '.js';

    var dir = prepareDir(meta.name, meta.version) + '/',
        src = dir + meta.name + srcSuffix,
        min = dir + meta.name + minSuffix;

    if (meta.src.length !== 0) {
        getData(meta.src[0], function(data) {
            handleResult(meta, templ, data, srcSuffix);
        });
    }

    if (meta.min.length !== 0) {
        getData(meta.min[0], function(data) {
            handleResult(meta, templ, data, minSuffix);
        });
    }

    // minify
    else if (meta.src.length !== 0){
        var uglify = require('../support/uglify-js/uglify-js'),
            jsp = uglify.parser.parse;
            pro = uglify.uglify,
            source = fs.readFileSync(src);
        fs.writeFileSync(min, pro.gen_code(jsp(source)));
    }
}

(function(exp) {
    if (!exp) return;
    exp.parseTemplate = parseTemplate;
    exp.getData = getData;
    exp.PLACEHOLDER = PLACEHOLDER;
    exp.prepareDir = prepareDir;
    exp.build = build;
})(exports);
