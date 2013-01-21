/*
 * Configuration
 * @author: Hsiaoming Yang <lepture@me.com>
 *
 */

var fs = require('fs-extra');
var os = require('os');
var path = require('path');
var color = require('colorful').color;
var config = require('./utils/config');
var pathlib = require('./utils/pathlib');
var logging = require('colorful').logging;
var spmrcPath = path.join(process.env.HOME, '.spm', 'spmrc');

// set or get config
exports.config = function(key, value) {
  // config('section.key', 'value')
  // config('section.key')
  // config('section.title.key')  [section:title]
  var data = config.parseSync(spmrcPath);
  if (!key) return renderConfig(data);

  var keys = key.split('.');
  var ret;
  if (!value) {
    ret = renderConfig(data);
    keys.forEach(function(section) {
      ret = ret ? ret[section] : null;
    });
    return ret;
  }
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
    logging.info('updated spmrc file');
    return data;
  }
  throw 'A valid input should be something like user.username=spm';

};


exports.remove = function(section) {
  var data = config.parseSync(spmrcPath);
  delete data[section];

  updateConfig(data);
  logging.info('delete section %s', section);
  return data;
};


exports.show = function() {
  var data = config.parseSync(spmrcPath);
  console.log();
  for (var section in data) {
    console.log('  ' + color.magenta('[' + section + ']'));
    for (var key in data[section]) {
      var value = data[section][key];
      if (value === 'false' || value === 'true') {
        value = color.blue(value);
      }
      console.log('  ' + color.cyan(key) + ' = ' + value);
    }
    console.log();
  }
};


function updateConfig(data) {
  var text = '';
  var init = true;

  for (var section in data) {
    if (!init) {
      text += os.EOL;
    } else {
      init = false;
    }
    text += '[' + section + ']' + os.EOL;
    for (var key in data[section]) {
      text += key + ' = ' + data[section][key] + os.EOL;
    }
  }

  pathlib.writeFileSync(spmrcPath, text);
}

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
