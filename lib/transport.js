var uglifyJS = require('../support/uglify-js/uglify-js'),
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
}

(function(exp) {
    if (!exp) return;
    exp.parse = parse;
})(exports);
