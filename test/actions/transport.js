var should = require('should');
require('shelljs/global');
var path = require('path');

var fsExt = require('../../lib/utils/fs_ext.js');

var DATA_DIR = path.join(__dirname, '../data/transports/');

describe.skip('spm transport action', function() {
  afterEach(function() {
    rm('-rf', path.join(DATA_DIR, 'seajs', '1.2.1'));
  });

  it('test transprot file meta parse', function(done) {
    var seajsMeta = Transport.getMeta(getFile('seajs'), function(err, meta) {
      should.not.exist(err);
      meta.version.should.eql('1.2.1');
      done();
    });
  });
  
  it('test transprot seajs', function(done) {
    var seajsDir = path.join(DATA_DIR, 'seajs');
    transport.run({modules: seajsDir}, function() {
      var version = ls(seajsDir);
      (version.indexOf('1.2.1') > -1).should.be.true;
      var files = ls(path.join(seajsDir, '1.2.1'));
      files.should.have.length(10);
      done();
    }); 
  });
});

// Helpers
function getFile(moduleName) {
  return path.join(DATA_DIR, moduleName, 'transport.js');
}

function getCode(filename) {
  return fsExt.readFileSync(filename);
}
