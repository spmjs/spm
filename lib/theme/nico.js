var path = require('path');
var fs = require('fs');
var pkg = require(path.join(process.cwd(), 'package.json'))
exports.package = pkg;

// {{ settings for nico
exports.theme = __dirname
exports.source = process.cwd()
exports.output = path.join(process.cwd(), '_site')
exports.permalink = '{{directory}}/{{filename}}.html'
exports.ignorefilter = function(filepath, subdir) {
  if (/^(_site|_theme|node_modules|\.idea)/.test(subdir)) {
    return false;
  }
  return true;
}
exports.writers = [
  'nico.PageWriter',
  'nico.StaticWriter',
  'nico.FileWriter',
  'nico.MochaWriter'
]
// end settings }}

exports.middlewares = [
  {
    name: 'CMD wrapper',
    filter: /\.js$/,
    handle: function(req, res, next) {
      fs.readFile(
        path.join(path.join(process.cwd(), '_site'), req.url), 'utf-8',
        function(err, data) {
          if (err) {
            res.writeHead(404);
            return res.end('Not Found');
          }
          res.writeHead(200);

          // wrap CommonJS file to CMD
          if (!/define\s*\(function\s*\(\s*require/.test(data) &&
            req.url.indexOf('?nowrap') < 0) {
            data = 'define(function(require, exports, module) {\n' + data;
            data = '/* Wrap by nico-cmd */\n' + data;
            data += '\n});'
          }
          res.end(data);
        }
      );
    }
  }
];
