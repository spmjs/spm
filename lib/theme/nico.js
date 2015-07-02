var path = require('path');
var spmrc = require('spmrc');
var internalIp = require('internal-ip');

var pkg = require(path.join(process.cwd(), 'package.json'));
exports.package = pkg;

// {{ settings for nico

exports.theme = __dirname;
exports.source = process.cwd();
exports.output = path.join(process.cwd(), '_site');
exports.permalink = '{{directory}}/{{filename}}.html';
exports.google = 'UA-50522089-2';
exports.yuanUrl = require('spmrc').get('registry');
exports.internalIp = internalIp();
exports.ignorefilter = function(filepath, subdir) {
  var extname = path.extname(filepath);
  var filename = path.basename(filepath);
  // dotfiles
  if (extname === '' && filename.indexOf('.') === 0) {
    return false;
  }
  if (extname === '.tmp' || extname === '.bak') {
    return false;
  }
  // html 需额外处理，不能做简单复制
  if (extname === '.html') {
    return false;
  }
  if (/\.DS_Store/.test(filepath)) {
    return false;
  }
  if (new RegExp('^' + spmrc.get('install.path')).test(subdir) &&
      /\.(md|markdown|html|psd|zip|yml)/.test(path.extname(filepath))) {
    return false;
  }
  if (/^(_site|_theme|node_modules|spm_modules|\.idea)/.test(subdir)) {
    return false;
  }
  return true;
};
exports.writers = [
  'nico-spm.PageWriter',
  'nico-spm.StaticWriter',
  'nico-spm.FileWriter',
  'nico-spm.MochaWriter'
];
