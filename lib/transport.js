var fs = require('fs'),
    annotation = require('./annotation');
    uglifyJS = require('../support/uglify-js/uglify-js'),
    jsp = uglifyJS.parse,
    uglify = uglifyJS.uglify;

function parse(text) {
    var comments, started = false, code = [],
        content = text.split(/\n|\r/);
    content = text.replace(/\/\*\*([\s\S]*?)\*\//g, function(all, cmt) {
        comments = all;
        return '';
    });
    console.log(content);
    console.log(comments);
    return {
        meta: annotation.parse(comments)
    };
}

function getData(addr, fn) {
    addr = require('url').parse(addr);
    addr.path = addr.pathname;

    // TODO handle utf8 code
    if (addr.protocol === 'http:') {
        console.log('getting content from %s..', addr.href);
        require('http').get(addr, function(res) {
            res.on('data', function(chuck) {
                fn && fn(chuck.toString());
            });
        });
    }

    // handle other protocol.
    else {
        //
    }
}

function getVersion(inputFile) {
    var loader = require('./loader');
    console.log(loader.createSandbox(inputFile));
}

(function(exp) {
    if (!exp) return;
    exp.parse = parse;
    exp.getData = getData;
    exp.getVersion = getVersion;
})(exports);
