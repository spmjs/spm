var fs = require('fs');
var uglifyjs = require('uglify-js');
var jsp = uglifyjs.parser;
var pro = uglifyjs.uglify;

module.exports = function(path, callback) {
    var code = fs.readFileSync(path);
    // 代码压缩.
    var ast = jsp.parse(code + '');

    ast = pro.ast_mangle(ast);
    ast = pro.ast_squeeze(ast);
    callback(pro.gen_code(ast) + ';');
};
