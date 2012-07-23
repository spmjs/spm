var fs = require('fs');
var uglifyjs = require('uglify-js');
var jsp = uglifyjs.parser;
var pro = uglifyjs.uglify;

module.exports = function(path, callback) {
  // 代码压缩.
  var code = fs.readFileSync(path);
  var ast = jsp.parse(code + '');

  ast = pro.ast_mangle(ast);
  ast = pro.ast_squeeze(ast);
  callback(pro.gen_code(ast) + ';');
};
