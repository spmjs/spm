var path = require('path');
var join = path.join;
var exeq = require('exeq');
var debug = require('debug')('spm:test');
var server = require('./doc').server;
var port = 8015;
var outputJSON = '_site/coverage.json';

module.exports = function(config, callback) {
  console.log();
  console.log('  Starting service for test runner ...'.to.cyan.color);

  var nocoverage = config.nocoverage;
  var coveralls = config.coveralls;
  var url = 'http://127.0.0.1:' + port + '/tests/runner.html';
  var mochaPhantomBin = join(require.resolve('mocha-phantomjs'), '../../bin/mocha-phantomjs');
  var istanbulBin = path.join(__dirname, '../node_modules/.bin/istanbul');
  var hook = join(__dirname, 'utils/coverage-hook.js');

  server({port: port}, function(err, app) {
    debug('server lanched at %s', url);

    // 1. run testcase
    var cmds = [mochaPhantomBin + ' '+ url];
    if (!nocoverage) {
      // 2. run testcase with coverage file if need coverage
      cmds.push(mochaPhantomBin + ' '+ url + '?cov --hooks ' + hook);
      // 3. then generate coverage reporter
      cmds.push(istanbulBin + ' report lcov text --include ' + outputJSON);

      // 4. generate lcov to stdout
      if (coveralls) {
        cmds.push('cat coverage/lcov.info');
      }
    }

    cmds.forEach(function(cmd) {
      debug('run command %s', cmd);
    });

    exeq.apply(this, cmds).then(function(results) {
      app.close(callback.bind(null, null, results));
    }, function(err) {
      app.close(callback.bind(null, err));
    });
  });
};
