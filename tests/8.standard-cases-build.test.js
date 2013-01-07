var fs = require('fs');
var path = require('path');
var should = require('should');
var require = require('./testutils');
var build = require('../lib/builtin/build');

var casedir = path.join(__dirname, 'standard-cases');
var cases = fs.readdirSync(casedir).filter(function(dir) {
  return fs.statSync(path.join(casedir, dir)).isDirectory();
})

describe('building cases', function() {
  cases.forEach(function(name) {
    var absdir = path.join(casedir, name);
    it(name, function() {
      build.run({
        config: path.join(absdir, 'binding.spm'),
        inputDirectory: path.join(absdir, 'src'),
        outputDirectory: path.join(absdir, 'dist')
      });
    });
  });
});
