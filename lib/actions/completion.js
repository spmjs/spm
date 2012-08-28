/**
 * @author lifesinger@gmail.com (Frank Wang)
 */

var fs = require('fs');
var path = require('path');

var StringUtil = require('../utils/string.js');
var ActionFactory = require('../core/action_factory.js');

var Completion = ActionFactory.create('Completion');

Completion.prototype.run = function() {
  var args = this.args;
  var firstArg = args[0];
  var secondArg = args[1];

  var spm = require('../spm.js');
  var out = '';

  // spm [TAB]
  if (firstArg === 'spm') {
    for (var p in spm) {
      if (isAction(p, spm)) {
        out += p.toLowerCase() + ' ';
      }
    }
  }

  // spm action
  else if (isAction(firstArg, spm)) {
    var SubAction = spm[StringUtil.capitalize(firstArg)];

    // spm action -[TAB]
    if (secondArg && secondArg.charAt(0) === '-') {
      out = getOptions(SubAction);
    }
    // spm action [TAB]
    else {
      // custom completion
      if (SubAction.hasOwnProperty('completion')) {
        out = SubAction['completion'];
      }
      // default
      else {
        out = getDirItems(secondArg || '');
      }
    }
  }

  // output
  out = out.trim();

  if (spm.cli) {
    process.stdout.write(out);
  }
  else {
    return out;
  }
};


function isAction(s, spm) {
  s = StringUtil.capitalize(s);

  return spm.hasOwnProperty(s) &&
      typeof spm[s] === 'function' &&
      s !== 'Completion';
}


function getOptions(action) {
  var out = '';
  var options = action.AVAILABLE_OPTIONS || {};

  for (var p in options) {
    if (options.hasOwnProperty(p)) {
      out += options[p].alias.join(' ');
      out += ' ';
    }
  }
  return out.trim();
}


function getDirItems(filepath) {
  var dirpath = path.dirname(filepath);
  if (dirpath === '.' && filepath.charAt(0) !== '.') {
    dirpath = '';
  }

  var dir = path.resolve(dirpath);
  var out = [];

  if (fs.existsSync(dir) && isDirectory(dir)) {

    fs.readdirSync(dir).forEach(function(item) {
      item = path.join(dirpath, item);

      if (path.extname(item)) {
        out.push(item);
      }
      else if (isDirectory(item)) {
        out.push(item + '/');
      }
    });
  }

  return out.join(' ');
}


function isDirectory(filepath) {
  return fs.statSync(filepath).isDirectory();
}


module.exports = Completion;
