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

  server({port: port, cov: !nocoverage}, function(err, app) {
    debug('server lanched at %s', url);

    // 1. run testcase with coverage file
    var cmds = [mochaPhantomBin + ' '+ url + '?cov --hooks ' + hook];
    if (!nocoverage) {
      // 2. then generate coverage reporter if need coverage
      cmds.push(istanbulBin + ' report lcov json-summary --include ' + outputJSON);

      // 3. generate lcov to stdout based on lcov reporter
      if (coveralls) {
        cmds.push('cat coverage/lcov.info');
      }
    }

    cmds.forEach(function(cmd) {
      debug('run command %s', cmd);
    });

    exeq.apply(this, cmds).then(function(results) {
      if (!nocoverage) {
        console.log();
        var covJSON = require(path.resolve('coverage/coverage-summary.json'));
        var summary = {
          lines: {total: 0, covered: 0},
          statements: {total: 0, covered: 0},
          functions: {total: 0, covered: 0},
          branches: {total: 0, covered: 0}
        };
        for (var file in covJSON) {
          ['lines', 'statements', 'functions', 'branches'].forEach(function (key) {
            summary[key].total += covJSON[file][key].total;
            summary[key].covered += covJSON[file][key].covered;
          });
        }
        var percentage = Math.round(100 * summary.lines.covered / summary.lines.total) + '%';
        console.log('  ' + percentage.to.green + ' coverage, ' +
        summary.lines.covered.toString().to.green + ' lines covered');
        for (file in covJSON) {
          console.log('    ' + path.relative(process.cwd(), file).to.grey + ': ' +
            (covJSON[file].lines.pct + '% ').to.green + 'coverage '.to.grey +
            covJSON[file].lines.covered.toString().to.green + ' lines covered '.to.grey
          );
        }
        console.log('  You can see more detail in ' + 'coverage/lcov-report/index.html'.to.cyan.color);
        console.log();
      }

      app.close(callback.bind(null, null, results));
    }, function(err) {
      app.close(callback.bind(null, err));
    });
  });
};
