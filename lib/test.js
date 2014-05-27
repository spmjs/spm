var exeq = require('exeq');
var path = require('path');
var output = '_site/coverage.html';
var outputJSON = '_site/coverage.json';
var spm = require('..');
var mochaBrowser = require('mocha-browser-for-spm');
var mo = require('../lib/sdk/module');
var file = require('../lib/sdk/file');
var log = require('../lib/utils/log');
var port = 8015;

module.exports = function(config) {

  var nocoverage = config.nocoverage;
  var coveralls = config.coveralls;

  var pkg = file.readJSON('package.json');
  if (!pkg) {
    log.error('miss', 'package.json or "spm" key');
    process.exit(2);
  }

  console.log();
  console.log('  Starting service for test runner ...'.to.cyan.color);

  spm.doc({
    server: true,
    port: port
  }, function() {

    mochaBrowser({
      page: 'http://127.0.0.1:' + port + '/tests/runner.html',
      reporter: 'spec'
    }, function(code) {
      if (code !== 0) {
        process.exit(code);
      }

      if (nocoverage) {
        process.exit(0);
      }

      mo.getSourceFiles().forEach(function(item) {
        if (!path.extname(item)) item = item + '.js';
        processCovFile(item);
      });

      if (coveralls) {
        exeq([
          path.dirname(__dirname) +
          '/node_modules/mocha-browser-for-spm/bin/mocha-browser ' +
          'http://127.0.0.1:' + port + '/tests/runner.html?cov -S -R lcov'
        ]).on('done', function() {
          process.exit(0);
        }).run();
      }

      exeq([
        path.dirname(__dirname) +
        '/node_modules/mocha-browser-for-spm/bin/mocha-browser ' +
        'http://127.0.0.1:' + port + '/tests/runner.html?cov -R html-cov -o ' +
        outputJSON +' > ' + output
      ]).on('done', function() {
        try{
            var covJSON = require(path.resolve(outputJSON));

            var percentage = Math.round(covJSON.coverage) + '%';
            var sloc = covJSON.sloc.toString();
            console.log('  ' + percentage.to.green + ' coverage, ' + sloc.to.green + ' sloc');

            for (var i=0; i<covJSON.files.length; i++) {
              var fileName = covJSON.files[i].filename;
              var filePercentage = Math.round(covJSON.files[i].coverage) + '%';
              var fileSloc = covJSON.files[i].sloc.toString();
              console.log('    ' + (path.relative(process.cwd(), fileName) + ': ').to.grey +
                filePercentage.to.green + ' coverage, '.to.grey + fileSloc.to.green + ' sloc'.to.grey);
            }

            console.log('  You can see more detail in ' + output.to.cyan.color);
          } catch(e) {
            console.log('');
            console.log(('   Fail to output ' + outputJSON).to.red.color);
          }
          process.exit(0);
      }).run();
    });
  });
};

function processCovFile(source) {
  var dest;
  if (/\.\w+$/.test(source)) {
    dest = source.replace(/(\.\w+)$/, '-cov$1');
  } else {
    dest = source + '-cov';
  }

  require('jscoverage').processFile(
    path.join(process.cwd(), source),
    path.join(process.cwd(), '_site/' + dest)
  );
}
