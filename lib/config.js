/*
 * Configuration
 * @author: Hsiaoming Yang <me@lepture.com>
 *
 */

var color = require('colorful');
var spmrc = require('spmrc');
var log = require('./utils/log');


exports.get = spmrc.get;

exports.set = function(key, value) {
  try {
    spmrc.set(key, value);
    log.info('update', key + ' changed to ' + value);
  } catch (e) {
    log.error('exit', e);
  }
};

exports.config = function(key, value) {
  if (!value) return exports.get(key);
  return exports.set(key, value);
};

exports.rm = exports.remove = function(section) {
  var data = spmrc.parse();
  delete data[section];

  spmrc.write(data);
  log.info('delete', section);
  return data;
};


exports.show = function() {
  var data = spmrc.parse();
  console.log();
  Object.keys(data).forEach(function(section) {
    console.log('  ' + color.magenta('[' + section + ']'));
    Object.keys(data[section]).forEach(function(key) {
      var value = data[section][key];
      if (value === 'false' || value === 'true') {
        value = color.blue(value);
      }
      console.log('  ' + color.cyan(key) + ' = ' + value);
    });
    console.log();
  });
};
