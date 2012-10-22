/**
 * @usage node index.js
 * @author kangpangpang@gmail.com (kangpangpang)
 */
var path = require('path');
var jasmine = require('jasmine-node');
var argv = require('optimist').argv;
var moduleJs = require('./module.js');

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

var executePath = __dirname;
var executeFile = /.*spec\.js$/;
if (argv.dir) {
  executePath = path.join(executePath, argv.dir);
}

if (argv.file) {
  executeFile = new RegExp(argv.file + '\.js$');
}

jasmine.executeSpecsInFolder(executePath, function(runner, log){
  if (runner.results().failedCount == 0) {
    process.exit(0);
  }
  else {
    process.exit(1);
  }
}, isVerbose, showColors, null, false, executeFile);
