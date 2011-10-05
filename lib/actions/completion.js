// vim: set tabstop=2 shiftwidth=2:

/**
 * @fileoverview spm completion.
 * @author yyfrankyy@gmail.com (Frank Xu)
 */

var fs = require('fs');
var path = require('path');

var spm = require('../spm');
var ActionFactory = require('./ActionFactory');


var Completion = ActionFactory.create('Completion');


Completion.prototype.run = function() {
  var args = this.args || this.modules;
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
    out = spm[firstArg].constructor.help;
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
  return typeof spm[s] === 'function' && s !== 'Completion';
}


module.exports = Completion;
