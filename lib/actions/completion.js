/**
 * @author lifesinger@gmail.com (Frank Wang)
 */

var fs = require('fs');
var path = require('path');

var StringUtil = require('../utils/String');
var ActionFactory = require('./ActionFactory');


var Completion = ActionFactory.create('Completion');


Completion.prototype.run = function() {
  var args = this.args;
  var firstArg = args[0];
  var secondArg = args[1];

  var spm = require('../spm');
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

    // spm action -[TAB]
    if (secondArg && secondArg.charAt(0) === '-') {
      out = getOptions(firstArg);
    }
    // spm action [TAB]
    else {
      out = getDirItems(secondArg);
    }
  }

  // output
  out = out.trim();

  if (require.main.exports === spm) {
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
  var options = spm(StringUtil.capitalize(action)).AVAILABLE_OPTIONS || {};

  for (var p in options) {
    if (options.hasOwnProperty(p)) {
      out += options[p].alias.join(' ');
      out += ' ';
    }
  }
  return out.trim();
}


function getDirItems(dir) {
  dir = path.dirname(path.resolve(dir));
  var out = [];

  if (path.existsSync(dir) && isDirectory(dir)) {
    fs.readdirSync(dir).forEach(function(item) {
      if (isDirectory(path.join(dir, item))) {
        item += '/';
      }
      out.push(item);
    });
  }

  return out.join(' ');
}


function isDirectory(filepath) {
  return fs.statSync(filepath).isDirectory();
}


module.exports = Completion;
