/**
 * @fileoverview Test Cases for meta_extractor.
 * @author lifesinger@gmail.com (Frank Wang)
 */

require('colors');
var path = require('path');
var fs = require('fs');
var assert = require('assert');
var astParse = require('uglify-js').parser.parse;

//var extractor = require('../../lib/helper/meta_extractor');


console.log('  test extract: '.cyan);
for (var i = 1; i < 9; i++) {
  console.log(i + '  ' + astParse(getCode('data/define_' + i + '.js')) + '\n');
}


// Helpers
function getCode(inputFile) {
  return fs.readFileSync(inputFile, 'utf-8');
}
