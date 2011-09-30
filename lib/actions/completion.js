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
  var len = args.length;
  var out = '';

  // spm [TAB]
  if (len === 1 && args[0] === 'spm') {
    for (var p in spm) {
      if (typeof spm[p] === 'function' && p !== 'completion') {
        out += p + ' ';
      }
    }
  }

  // spm action [TAB]
  else if (len === 2) {
    // TODO
  }

  // output
  if (module.main === spm) {
    process.stdout.write(out);
  }
  else {
    return out;
  }
};


module.exports = Completion;
