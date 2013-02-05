/*
 * Configuration
 * @author: Hsiaoming Yang <lepture@me.com>
 *
 */

var color = require('colorful').color;
var spmrc = require('./sdk/spmrc');
var log = require('./utils/log');


exports.set = spmrc.set;
exports.get = spmrc.get;
exports.config = spmrc.config;

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
