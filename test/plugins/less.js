
var should = require('should');
var path = require('path');
var ProjectFactory = require('../../lib/core/project_factory.js');
var fsExt = require('../../lib/utils/fs_ext.js');
var Opts = require('../../lib/utils/commander.js');
var less = require('less');
require('../module.js');

describe('less project test', function() {
  var action = "build";
  var opts = Opts.get(action);
  var dir = path.join(path.dirname(module.filename), "../data/modules/lessModule/");
 
  var lessPlugin = require('../../lib/plugins/less.js');
  var resources = require('../../lib/plugins/resources.js');
  var clean = require('../../lib/plugins/clean.js');

  lessPlugin.setOpts(opts);
  resources.setOpts(opts);
  clean.setOpts(opts);

  beforeEach(function(done) {
     
    getProjectModel(dir, function(model) {
      resources.execute(model, function() {
        done();
      });
    });
  });

  afterEach(function(done) {
    getProjectModel(dir, function(model) {
      clean.execute(model, function() {
        done();
      });
    });
  });

  it('test less plugin', function(done) {
    getProjectModel(dir, function(model) {
      var src = model.srcDirectory;
      var build = model.buildDirectory;
      // console.info('lesss---->', less);
      // console.info('result---->', jshint.errors);
      // console.info('result---->', result);
      done();
    });
  });
});




