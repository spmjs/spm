var path = require('path');
var join = path.join;
var fs = require('fs');
var exeq = require('exeq');
var Instrumenter = require('istanbul').Instrumenter;
var server = require('./doc').server;
var mo = require('../lib/sdk/module');
var port = 8015;
var outputJSON = '_site/coverage.json';

var instrumenter = new Instrumenter();

module.exports = function(config, callback) {

  var nocoverage = config.nocoverage;
  var coveralls = config.coveralls;

  console.log();
  console.log('  Starting service for test runner ...'.to.cyan.color);

  var url = 'http://127.0.0.1:' + port + '/tests/runner.html';
  var mochaPhantomBin = join(require.resolve('mocha-phantomjs'), '../../bin/mocha-phantomjs');
  var istanbulBin = path.join(__dirname, '../node_modules/.bin/istanbul');
  var hook = join(__dirname, 'utils/coverage-hook.js');

  server({port: port}, function() {
    // 1. run testcase
    var cmds = [mochaPhantomBin + ' '+ url];
    if (!nocoverage) {
      mo.getSourceFiles().forEach(function(item) {
        if (!path.extname(item)) {
          item = item + '.js';
        }
        if (path.extname(item) === '.js') {
          processCovFile(item);
        }
      });

      // 2. run testcase with coverage file if need coverage
      cmds.push(mochaPhantomBin + ' '+ url + '?cov --hooks ' + hook);
      // 3. then generate coverage reporter
      cmds.push(istanbulBin + ' report lcov text --include ' + outputJSON);

      // 4. generate lcov to stdout
      if (coveralls) {
        cmds.push('cat coverage/lcov.info');
      }
    }

    exeq.apply(this, cmds).then(callback.bind(null, null), callback);
  });
};

function processCovFile(source) {
  var dest;
  if (/\.\w+$/.test(source)) {
    dest = source.replace(/(\.\w+)$/, '-cov$1');
  } else {
    dest = source + '-cov';
  }

  var file = path.join(process.cwd(), source);
  var code = fs.readFileSync(file).toString();
  var changed = instrumenter.instrumentSync(code, file);
  fs.writeFileSync(path.join(process.cwd(), '_site', dest), changed);
}
