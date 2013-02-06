var fs = require('fs');
var path = require('path');
var should = require('should');
var require = require('./_require');
var spm = require('..');

var casedir = path.join(__dirname, 'standard-cases');
var cases = fs.readdirSync(casedir).filter(function(dir) {
  return fs.statSync(path.join(casedir, dir)).isDirectory();
});

var cwd = process.cwd();

describe('building cases', function() {
  cases.forEach(function(name) {
    var absdir = path.join(casedir, name);
    it(name, function() {
      process.chdir(absdir);
      spm.build({quiet: true});
    });
  });
});
