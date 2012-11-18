require('shelljs/global');
var path = require('path');

var transport = require('../../lib/spm.js').getAction('transport');
var Transport = require('../../lib/actions/transport.js');

var fsExt = require('../../lib/utils/fs_ext.js');

var DATA_DIR = path.join(__dirname, '../data/transports/');

describe('spm transport action', function() {
  afterEach(function() {
    rm('-rf', path.join(DATA_DIR, 'seajs', '1.2.1'));
  });

  it('test transprot file meta parse', function() {
    var seajsMetaParse = false;
    runs(function() {
      var seajsMeta = Transport.getMeta(getFile('seajs'), function(err, meta) {
        expect(err).toBe(undefined);
        expect(meta.version).toEqual('1.2.1');
        seajsMetaParse = true;
      });
    });

    waitsFor(function() {
      return seajsMetaParse;
    });
  });

  
  it('test transprot seajs', function() {
    var seajsMetaParse = false;
    runs(function() {
      var seajsDir = path.join(DATA_DIR, 'seajs');
      transport.run({modules: seajsDir}, function() {
        var version = ls(seajsDir);
        expect(version.indexOf('1.2.1') > -1).toBeTruthy();
        var files = ls(path.join(seajsDir, '1.2.1'));

        // add pacakge.json
        expect(files.length).toEqual(10);
        seajsMetaParse = true;
      }); 
    });

    waitsFor(function() {
      return seajsMetaParse;
    }, 20000);
  });

});

// Helpers
function getFile(moduleName) {
  return path.join(DATA_DIR, moduleName, 'transport.js');
}

function getCode(filename) {
  return fsExt.readFileSync(filename);
}
