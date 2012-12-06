/*
 * Configuration
 * @author: Hsiaoming Yang <lepture@me.com>
 *
 */

var fs = require('fs')
var os = require('os')
var path = require('path')
var logging = require('../terminal/logging')
var color = require('../terminal/color')
var config = require('../helpers/config')
var utils = require('../utils')
var spmrcPath = path.join(process.env['HOME'], '.spm', 'spmrc')
utils.safeWrite(spmrcPath)

exports.description = 'configuration for spm'


// set or get config
exports.config = function(obj) {
  var data = config.parseSync(spmrcPath)
  if (!obj) return data;

  for (var key in obj) {
    var value = obj[key]
    var keys = key.split('.')
    if (keys.length !== 2) throw 'A valid input should be something like user.username=spm';
    data[keys[0]] = data[keys[0]] || {}
    data[keys[0]][keys[1]] = value
  }

  updateConfig(data)
  logging.info('updated spmrc file')
  return data
}


exports.remove = function(section) {
  var data = config.parseSync(spmrcPath)
  delete data[section]

  updateConfig(data)
  logging.info('delete section %s', section)
  return data
}


exports.show = function() {
  if (!fs.existsSync(spmrcPath)) {
    updateConfig({'user': {'username': 'spm'}})
  }
  var data = config.parseSync(spmrcPath)
  console.log()
  for (var section in data) {
    console.log('  ' + color.magenta('[' + section + ']'))
    for (var key in data[section]) {
      var value = data[section][key]
      if (value === 'false' || value === 'true') {
        value = color.blue(value)
      }
      console.log('  ' + color.cyan(key) + ' = ' + value)
    }
    console.log()
  }
}


function updateConfig(data) {
  var text = ''
  var init = true

  for (var section in data) {
    if (!init) {
      text += os.EOL
    } else {
      init = false
    }
    text += '[' + section + ']' + os.EOL
    for (var key in data[section]) {
      text += key + ' = ' + data[section][key] + os.EOL
    }
  }

  fs.writeFileSync(spmrcPath, text)
}
