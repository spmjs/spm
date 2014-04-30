var path = require('path');
var fs = require('fs');
var pkg = require(path.join(process.cwd(), 'package.json'));
var cssDependencies = require('./utils').cssDependencies;
exports.package = pkg;

// {{ settings for nico
exports.theme = __dirname;
exports.source = process.cwd();
exports.output = path.join(process.cwd(), '_site');
exports.permalink = '{{directory}}/{{filename}}.html';
exports.google = 'UA-50522089-2';
exports.ignorefilter = function(filepath, subdir) {
  if (/^sea-modules/.test(subdir) &&
      /\.[md|html|psd|zip|yml]/.test(path.extname(filepath))) {
    return false;
  }
  if (/^(_site|_theme|node_modules|\.idea)/.test(subdir)) {
    return false;
  }
  return true;
};
exports.writers = [
  'nico.PageWriter',
  'nico.StaticWriter',
  'nico.FileWriter',
  'nico.MochaWriter'
];

exports.middlewares = [
  {
    name: 'CMD wrapper',
    filter: /\.js$/,
    handle: function(req, res, next) {
      fs.readFile(
        path.join(process.cwd(), '_site', req.url), 'utf-8',
        function(err, data) {
          if (err) {
            res.writeHead(404);
            return res.end('Not Found');
          }
          res.setHeader("Content-Type", 'application/javascript');
          res.writeHead(200);

          // wrap CommonJS file to CMD
          if (!/define\s*\(function\s*\(\s*require/.test(data) &&
            req.url.indexOf('?nowrap') < 0) {
            data = 'define(function(require, exports, module) {\n' + data;
            data = '/* Wrapped to CMD by spm doc server */\n' + data;
            data += '\n});';
          }
          res.end(data);
        }
      );
    }
  }
];

var cssDeps = cssDependencies();
if (Object.keys(cssDeps).length) {
  var ImportReg = new RegExp('/(' + Object.keys(cssDeps).join('|') + ')$');
  exports.middlewares.push({
    name: '@import router',
    filter: ImportReg,
    handle: function(req, res, next) {
      var name = req.url.match(ImportReg)[1];
      var cssPath = cssDeps[name];
      fs.readFile(
        path.join(process.cwd(), '_site', cssPath), 'utf-8',
        function(err, data) {
          if (err) {
            res.writeHead(404);
            return res.end('Not Found');
          }
          res.setHeader("Content-Type", 'text/css');
          res.writeHead(200);
          res.end(data);
        }
      );
    }
  });
}

// end settings }}
