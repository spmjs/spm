/*
 * Config Parser
 *
 * Thanks to: https://github.com/shockie/iniparser
 *
 * An example of ~/.spm/spmrc
 *
 * [user]
 * username=lepture
 * password=1234
 *
 * [mirror:spmjs]
 * url=http://modules.spmjs.org
 *
 * [mirror:alipay]
 * url=http://modules.alipay.im
 *
 * [server:p148]
 * username=admin
 * password=123
 * filepath=/www/static
 *
 */

var fs = require('fs');

exports.parse = function(file, callback) {
  if (!callback) return;
  fs.readFile(file, 'utf8', function(err, data) {
    if (err) {
      callback(err);
    }else {
      callback(null, parse(data));
    }
  });
};

exports.parseSync = function(file) {
  return parse(fs.readFileSync(file, 'utf8'));
};

var regex = {
  section: /^\s*\[\s*([^\]]*)\s*\]\s*$/,
  param: /^\s*([\w\.\-\_]+)\s*=\s*(.*?)\s*$/,
  comment: /^\s*;.*$/
};

function parse(data) {
  var value = {};
  var lines = data.split(/\r\n|\r|\n/);
  var section = null;
  lines.forEach(function(line) {
    if (regex.comment.test(line)) {
      return;
    }else if (regex.param.test(line)) {
      var match = line.match(regex.param);
      if (section) {
        value[section][match[1]] = match[2];
      }else {
        value[match[1]] = match[2];
      }
    }else if (regex.section.test(line)) {
      var match = line.match(regex.section);
      value[match[1]] = {};
      section = match[1];
    }else if (line.length == 0 && section) {
      section = null;
    }
  });
  return value;
}
