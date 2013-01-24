var fs = require('fs');
var path = require('path');
var should = require('should');
var fs = require('fs-extra');
var require = require('./_require');
var ast = require('../lib/sdk/ast');
var transform = require('../lib/sdk/transform');

var src = path.join(__dirname, 'data');
var dest = path.join(__dirname, 'tmp');

describe('transform', function() {
  it('can transform js', function() {
    transform.transform(src, dest, {
      root: 'arale',
      name: 'base',
      version: '1.0.0'
    });
    // TODO: verify
    fs.removeSync(dest);
  });
});
