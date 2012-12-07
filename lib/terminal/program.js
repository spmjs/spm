/*
 * Color supports in terminal
 * @author: Hsiaoming Yang <lepture@me.com>
 *
 */


function Command(name, executable, description) {
  if (!(this instanceof Command)) {
    return new Command(name, executable, description)
  }

  this.name = name
  if (executable.indexOf(' ') !== -1 || !description) {
    description = executable
    executable = 'spm-' + name
  }
  this.executable = executable
  this.description = description
}

Command.prototype.executable = function(executable) {
  this.executable = executable
}

Command.prototype.description = function(description) {
  this.description = description
}


exports.Command = Command

exports.printHelp = function(cmd) {
  var text = '    ' + pad(cmd.name, 15)
  if (cmd.description.length > 60) {
    text += cmd.description.slice(0, 58)
    if (cmd.description.slice(58, 59) !== ' ') {
      text += '-'
    }
    text += '\n'
    text += Array(21).join(' ')
    text += cmd.description.slice(58)
  } else {
    text += cmd.description
  }
  console.log(text)
}

function pad(str, width) {
  var len = Math.max(0, width - str.length)
  return str + Array(len + 1).join(' ')
}
