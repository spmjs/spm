/*
 * Config Parser
 * @author: Hsiaoming Yang <lepture@me.com>
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

var fs = require('fs')
var os = require('os')
var path = require('path')
var logging = require('../terminal/logging')

var home = process.env['HOME']
var spmrc = path.join(home, '.spm', 'spmrc')

exports.parse = function(file, callback){
  if(!callback) return;
  fs.readFile(file, 'utf8', function(err, data){
    if(err){
      callback(err)
    }else{
      callback(null, parse(data))
    }
  })
}

exports.parseSync = function(file){
  return parse(fs.readFileSync(file, 'utf8'))
}

exports.spmConfig = function(obj) {
  var data = parse(fs.readFileSync(spmrc, 'utf8'))
  if (!obj) return data;

  for (var key in obj) {
    var value = obj[key]
    var keys = key.split('.')
    if (keys.length !== 2) throw 'A valid input should be something like user.username=spm';
    data[keys[0]] = data[keys[0]] || {}
    data[keys[0]][keys[1]] = value
  }

  update(data)
  logging.info('updated spmrc file')
  return data
}

var regex = {
  section: /^\s*\[\s*([^\]]*)\s*\]\s*$/,
  param: /^\s*([\w\.\-\_]+)\s*=\s*(.*?)\s*$/,
  comment: /^\s*;.*$/
}

function parse(data) {
  var value = {}
  var lines = data.split(/\r\n|\r|\n/)
  var section = null
  lines.forEach(function(line){
    if(regex.comment.test(line)){
      return;
    }else if(regex.param.test(line)){
      var match = line.match(regex.param)
      if(section){
        value[section][match[1]] = match[2]
      }else{
        value[match[1]] = match[2]
      }
    }else if(regex.section.test(line)){
      var match = line.match(regex.section)
      value[match[1]] = {}
      section = match[1]
    }else if(line.length == 0 && section){
      section = null
    }
  })
  return value
}

function update(data) {
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

  fs.writeFileSync(spmrc, text)
}
