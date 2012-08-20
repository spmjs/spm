var path = require('path');

var buildAction = require('../../lib/actions/build.js');
var dir = path.join(path.dirname(module.filename), "../data/modules/relativeModule/");

describe('relative modules build test', function() {
  it('test relative module build ', function() {
    var buildOver = false;
    var e;
    runs(function() {
      getProjectModel('build', dir, function(model) {
        buildAction.executePlugins(model, function(err) {
          e = err; 
          expect(err).toBeFalsy();
          buildOver = true;
        });
      });
    });

    waitsFor(function() {
      return buildOver;
    });
  });
});

