
/**
 * @fileoverview Run wrapping modules in node.
 * @author lifesinger@gmail.com (Frank Wang)
 */

var path = require('path');
var util = require('../util');


var firstArg = process.argv[2];
try {
  if (firstArg && firstArg !== '--help') {
    var inputFile = util.normalize(firstArg);
  }
}
catch (ex) {
  console.log("Cannot find module '" + firstArg + "'");
}

if (!inputFile) {
  console.log('Usage: snode filename.js [--base /path/to/modules/]');
  process.exit();
}


// node snode filename.js [--base /path/to/modules/]
var base;
if (process.argv[3] === '--base') {
  base = process.argv[4];
}


require('./loader').run(inputFile, base);
