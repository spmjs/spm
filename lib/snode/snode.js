
/**
 * @fileoverview Run wrapping modules in node.
 * @author lifesinger@gmail.com (Frank Wang)
 */

var path = require('path');
var util = require('../util');


var inputFile = process.argv[2];
try {
  inputFile = util.normalize(inputFile);
}
catch(ex) {
  if (inputFile) {
    console.log("Cannot find module '" + inputFile + "'");
  }
  console.log('Usage: snode filename.js [--base /path/to/modules/]');
  process.exit();
}


// node snode filename.js [--base /path/to/modules/]
var base;
if (process.argv[3] === '--base') {
  base = process.argv[4];
}


require('./loader').run(inputFile, base);
