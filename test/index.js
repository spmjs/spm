/**
 * @usage node index.js
 * @author kangpangpang@gmail.com (kangpangpang)
 */
var jasmine = require('jasmine-node');
var moduleJs = require('./module.js');

var sys = require('sys');
require('../lib/utils/log.js');

for(var key in jasmine) {
  global[key] = jasmine[key];
}

var isVerbose = true;
var showColors = true;

process.argv.forEach(function(arg){
    switch(arg) {
          case '--color': showColors = true; break;
          case '--noColor': showColors = false; break;
          case '--verbose': isVerbose = true; break;
    }
});

jasmine.executeSpecsInFolder(__dirname, function(runner, log){
  if (runner.results().failedCount == 0) {
    process.exit(0);
  }
  else {
    process.exit(1);
  }
}, isVerbose, showColors, null, false, /.*spec\.js$/);

