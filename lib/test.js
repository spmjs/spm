var exeq = require('exeq');
var path = require('path');
var fs = require('fs');
var mochaBrowser = require('mocha-browser2');
var spawn = require('child_process').spawn;
var Instrumenter = require('istanbul').Instrumenter;
var doc = require('./doc');
var mo = require('../lib/sdk/module');
var port = 8015;
var outputJSON = '_site/coverage.json';

var instrumenter = new Instrumenter();

module.exports = function(config) {

  var nocoverage = config.nocoverage;
  var coveralls = config.coveralls;

  console.log();
  console.log('  Starting service for test runner ...'.to.cyan.color);

  doc({
    server: true,
    port: port
  }, function() {

    mochaBrowser({
      page: 'http://127.0.0.1:' + port + '/tests/runner.html',
      reporter: 'spec',
      timeout: 0
    }, function(code) {
      if (code !== 0) {
        process.exit(code);
      }

      if (nocoverage) {
        process.exit(0);
      }

      mo.getSourceFiles().forEach(function(item) {
        if (!path.extname(item)) {
          item = item + '.js';
        }
        if (path.extname(item) === '.js') {
          processCovFile(item);
        }
      });

      var coverUrl = 'http://127.0.0.1:' + port + '/tests/runner.html?cov';

      if (coveralls) {
        coverage(coverUrl, 'lcov', function(err) {
          if (err) {
            console.error(err);
            process.exit(1);
          } else {
            process.exit();
          }
        });
        return;
      }

      coverage(coverUrl, 'text-summary', function(err) {
        if (err) {
          console.error(err);
          process.exit(1);
        } else {
          process.exit();
        }
      });
    });
  });
};

function coverage(coverUrl, format, cb) {
  var phantomBin = require('phantomjs').path;
  var adapter = path.join(__dirname, 'utils/istanbul-phantom.js');
  var istanbulBin = path.join(__dirname, '../node_modules/.bin/istanbul');

  var cover = spawn(phantomBin, [adapter, coverUrl], {});
  cover
  .once('error', cb)
  .once('close', function() {
    exeq([
      istanbulBin + ' report ' + format + ' --include ' + outputJSON
    ])
    .on('error', cb)
    .on('done', cb);
  });
  cover.stdout.pipe(fs.createWriteStream(outputJSON));
}

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
