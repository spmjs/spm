var path = require('path');
var fs = require('fs');
var serveSPM = require('serve-spm');

var pkg = require(path.join(process.cwd(), 'package.json'));
exports.package = pkg;

// {{ settings for nico

exports.theme = __dirname;
exports.source = process.cwd();
exports.output = path.join(process.cwd(), '_site');
exports.permalink = '{{directory}}/{{filename}}.html';
exports.google = 'UA-50522089-2';
exports.ignorefilter = function(filepath, subdir) {
  var extname = path.extname(filepath);
  if (extname === '.tmp' || extname === '.bak') {
    return false;
  }
  if (/\.DS_Store/.test(filepath)) {
    return false;
  }
  if (/^sea-modules/.test(subdir) &&
      /\.(md|markdown|html|psd|zip|yml)/.test(path.extname(filepath))) {
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
    name: 'Serve SPM',
    filter: /\.(css|less|js|json|tpl|handlebars)$/,
    handle: serveSPM(exports.output)
  }
];

// end settings }}
