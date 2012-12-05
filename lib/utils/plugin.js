/*
 * Plugin System
 * @author: Hsiaoming Yang <lepture@me.com>
 *
 */

var fs = require('fs')
var os = require('os')
var path = require('path')
var logging = require('../terminal/logging')

var home = process.env['HOME']
var plugins = path.join(home, '.spm', 'plugins')


function install(name) {
  var lines = list()
  lines.forEach(function(line) {
    if (line === name) {
      throw 'plugin ' + name + ' has already installed!'
    }
  })
  fs.appendFileSync(plugins, name + os.EOL)
  return name
}

function list() {
  if (!fs.existsSync(plugins)) return [];

  var data = fs.readFileSync(plugins, 'utf8')
  var lines = data.split(/\r\n|\r|\n/)
  var gallery = []
  lines.forEach(function(line) {
    if (line) gallery.push(line);
  })
  return gallery
}

exports.install = install
exports.list = list
