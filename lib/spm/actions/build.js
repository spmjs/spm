
var fs = require('fs');
var path = require('path');

var util = require('../util');
var extract = require('./extract');
var combo = require('./combo');
var alias = require('./alias');


var inputArgs = [];
var isCombo = false;
var comboAll = false;
var isRecursive = false;
var configFile;

// node sbuild [--combo] [-r] a.js b.js [--config path/to/app-config.js]
for (var i = 2; i < process.argv.length; i++) {
  var arg = process.argv[i];
  if (arg === '--combo') {
    isCombo = true;
    if (process.argv[++i] === 'all') {
      comboAll = true;
    }
  }
  else if (arg === '-r') {
    isRecursive = true;
  }
  else if (arg === '--config') {
    configFile = process.argv[++i];
  }
  else {
    inputArgs.push(arg);
  }
}


var first = inputArgs[0];
if (!first || /^(?:--help|help|\?)$/.test(first)) {
  console.log('Usage:');
  console.log('  sbuild a.js');
  console.log('  sbuild a.js --combo');
  console.log('  sbuild a.js --combo all');
  console.log('  sbuild a.js --combo all --config path/to/app-config.js');
  console.log('  sbuild *.js');
  console.log('  sbuild some_directory --combo -r');
  console.log('  sbuild clear');
  process.exit();
}
// sbuild clear
else if (first == 'clear') {
  require('./clear').run(process.cwd());
  process.exit();
}


// Gets the config file.
if (first) {
  configFile = alias.getConfigFile(first, configFile);
}


build(inputArgs, process.cwd(), true);
process.exit();


function build(names, basedir, first) {
  names.forEach(function(name) {

    var p = util.normalize(name, basedir);
    var stat = fs.statSync(p);

    if (p.indexOf('.') !== 0 && stat.isFile()) {
      buildFile(p);
    }
    else if ((first || isRecursive) &&
        p.indexOf('__build') === -1 &&
        stat.isDirectory()) {
      build(fs.readdirSync(p), p);
    }

  });
}


function buildFile(filepath) {
  if (isCombo) {
    combo.run(filepath, 'auto', comboAll, configFile);
  }
  else {
    var outfile = extract.run(filepath, 'auto', { 'compress': true });
    console.log('Successfully build to ' + util.getRelativePath(outfile));
  }
}
