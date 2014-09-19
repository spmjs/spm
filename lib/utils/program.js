/*
 * Command helper in terminal
 * @author: Hsiaoming Yang <me@lepture.com>
 *
 */

var fs = require('fs');
var path = require('path');
var color = require('colorful');


function Command(name, executable, description) {
  if (!(this instanceof Command)) {
    return new Command(name, executable, description);
  }
  if (typeof name === 'object') {
    this.name = name.name;
    this.executable = name.executable || name.name;
    this.description = name.description;
    this.version = name.version;
    this.group = name.group;
    this.color = name.color;
    return this;
  }

  this.name = name;
  if (!description) {
    description = executable;
    executable = name;
  }
  this.executable = executable;
  this.description = description;
  this.version = undefined;
  this.group = undefined;
  this.color = undefined;
  return this;
}

Command.prototype.executable = function(executable) {
  this.executable = executable;
};

Command.prototype.description = function(description) {
  this.description = description;
};

exports = module.exports = Command;

exports.printHelp = function(cmd) {
  var colorfunc = null;
  if (typeof cmd.color === 'string') {
    colorfunc = color[cmd.color];
  } else if (typeof cmd.color === 'function') {
    colorfunc = cmd.color;
  }
  var name = cmd.name;
  if (colorfunc) {
    name = colorfunc(name);
  }
  var text = '    ' + pad(name, 15, cmd.name.length);
  if (cmd.description.length > 60) {
    text += cmd.description.slice(0, 58);
    if (cmd.description.slice(58, 59) !== ' ') {
      text += '-';
    }
    text += '\n';
    text += new Array(21).join(' ');
    text += cmd.description.slice(58);
  } else {
    text += cmd.description;
  }
  console.log(text);
};

function pad(str, width, strWidth) {
  var len = Math.max(0, width - (strWidth || str.length));
  return str + new Array(len + 1).join(' ');
}
