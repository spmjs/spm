/*
 * Plugin System
 * @author: Hsiaoming Yang <lepture@me.com>
 *
 */

var fs = require('fs')
var os = require('os')
var path = require('path')

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

function uninstall(name) {
  var lines = list()
  var index = lines.indexOf(name)
  if (index === -1) {
    throw 'plugin ' + name + ' is not installed!'
  }
  var before = lines.slice(0, index)
  var after = lines.slice(index + 1)
  var gallery = before.concat(after)
  var text = gallery.join(os.EOL) + os.EOL
  fs.writeFileSync(plugins, text)
  return name
}

function list() {
  if (!fs.existsSync(plugins)) return [];

  var data = fs.readFileSync(plugins, 'utf8')
  var lines = data.split(/\r\n|\r|\n/)
  var gallery = []
  lines.forEach(function(line) {
    if (line && gallery.indexOf(line) === -1) gallery.push(line);
  })
  return gallery
}

exports.install = install
exports.uninstall = uninstall
exports.list = list
