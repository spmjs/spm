var fs = require('fs');
var path = require('path');
var ast = require('./ast');
var pathlib = require('../utils/pathlib');


exports.compress = compress;

function compress(src, dest, encoding) {
  encoding = encoding || 'utf8';
  var files = pathlib.walkdirSync(src);
  files.forEach(function(fpath) {
    if (/\.js$/.test(fpath)) {
      compressJS(src, dest, fpath, encoding);
    }
  });
}

function compressJS(src, dest, fpath, encoding) {
  var data = fs.readFileSync(fpath, encoding);
  var astCache = ast.getAst(data);
  var destfile = path.join(dest, fpath.replace(src, '').replace(/^\//, ''));
  var debugfile = destfile.replace(/\.js$/, '-debug.js');

  pathlib.writeFileSync(debugfile, ast.replaceAll(astCache, function(v) {
    if (/\.js$/.test(v)) {
      return v.replace(/\.js$/, '-debug.js');
    }
    return v + '-debug';
  }));

  // TODO: uglify compress options
  pathlib.writeFileSync(destfile, astCache.print_to_string({
  }));
}

function compressCSS(src, dest, fpath, encoding) {
}
