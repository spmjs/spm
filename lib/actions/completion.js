/**
 * @author lifesinger@gmail.com (Frank Wang)
 */

var fs = require('fs');
var path = require('path');

var spm = require('../spm');
var StringUtil = require('../utils/String');
var ActionFactory = require('./ActionFactory');


var Completion = ActionFactory.create('Completion');


Completion.prototype.run = function() {
  var args = this.args;
  var firstArg = args[0];
  var out = '';

  // spm [TAB]
  if (firstArg === 'spm') {
    for (var p in spm) {
      if (isAction(p)) {
        out += p.toLowerCase() + ' ';
      }
    }
  }

  // spm action [TAB]
  else if (isAction(firstArg)) {
    out = spm[StringUtil.capitalize(firstArg)].prototype.completion;
  }

  // output
  out = out.trim();

  if (module.main === spm) {
    process.stdout.write(out);
  }
  else {
    return out;
  }
};


function isAction(s) {
  s = StringUtil.capitalize(s);
  return spm.hasOwnProperty(s) &&
      typeof spm[s] === 'function' &&
      s !== 'Completion';
}


module.exports = Completion;
