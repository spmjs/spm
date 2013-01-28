/*
 * spm.sdk.spmrc
 *
 * Thanks to: https://github.com/shockie/iniparser
 *
 * An example of ~/.spm/spmrc
 *
 * [user]
 * username=lepture
 *
 * [server:spm]
 * url = https://spmjs.org
 *
 */

var fs = require('fs');
var grunt = require('grunt');
var path = require('path');

exports.spmrcfile = path.join(process.env.HOME, '.spm', 'spmrc');

exports.get = function(key) {
  var data = parse(exports.spmrcfile);
  var ret = renderConfig(data);
  if (!key) return ret;

  key = key.replace(':', '.');
  var keys = key.split('.');
  keys.forEach(function(section) {
    ret = ret ? ret[section] : null;
  });
  return ret;
};

exports.set = function(key, value) {
  var data = parse(exports.spmrcfile);
  var keys = key.split('.');
  var ret;

  if (keys.length === 3) {
    ret = [];
    ret.push(keys[0] + ':' + keys[1]);
    ret.push(keys[2]);
    keys = ret;
  }
  if (keys.length === 2) {
    data[keys[0]] = data[keys[0]] || {};
    data[keys[0]][keys[1]] = value;
    updateConfig(data);
    return data;
  }
  throw 'A valid input should be something like user.username=spm';
};


exports.config = function(key, value) {
  if (!value) return exports.get(key);
  return exports.set(key, value);
};


var regex = {
  section: /^\s*\[\s*([^\]]*)\s*\]\s*$/,
  param: /^\s*([\w\.\-\_]+)\s*=\s*(.*?)\s*$/,
  comment: /^\s*;.*$/
};

function parse(file) {
  file = file || exports.spmrcfile;
  if (!fs.existsSync(file)) {
    return {};
  }
  var data = grunt.file.read(file);
  var value = {};
  var lines = data.split(/\r\n|\r|\n/);
  var section = null;
  var match;
  lines.forEach(function(line) {
    if (regex.comment.test(line)) {
      return;
    } else if (regex.param.test(line)) {
      match = line.match(regex.param);
      if (section) {
        value[section][match[1]] = match[2];
      }else {
        value[match[1]] = match[2];
      }
    } else if (regex.section.test(line)) {
      match = line.match(regex.section);
      value[match[1]] = {};
      section = match[1];
    } else if (line.length === 0 && section) {
      section = null;
    }
  });
  return value;
}
exports.parse = parse;


function updateConfig(data) {
  var text = '';
  var init = true;

  Object.keys(data).forEach(function(section) {
    if (!init) {
      text += '\n';
    } else {
      init = false;
    }
    text += '[' + section + ']\n';
    Object.keys(data[section]).forEach(function(key) {
      text += key + ' = ' + data[section][key] + '\n';
    });
  });
  grunt.file.write(exports.spmrcfile, text);
}
exports.write = updateConfig;

function renderConfig(data) {
  var ret = {};
  for (var section in data) {
    var sections = section.split(':');
    if (sections.length === 2) {
      ret[sections[0]] = ret[sections[0]] || {};
      ret[sections[0]][sections[1]] = data[section];
    } else {
      ret[section] = data[section];
    }
  }
  return ret;
}
