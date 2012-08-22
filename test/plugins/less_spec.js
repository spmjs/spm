
var path = require('path');
var ProjectFactory = require('../../lib/core/project_factory.js');
var fsExt = require('../../lib/utils/fs_ext.js');
var Opts = require('../../lib/utils/opts.js');
var less = require('less');

describe('less project test', function() {
  var action = "build";
  var argv = Opts.get(action).argv;
  var dir = path.join(path.dirname(module.filename), "../data/modules/lessModule/");
 
  var lessPlugin = require('../../lib/plugins/less.js');
  var resources = require('../../lib/plugins/resources.js');
  var clean = require('../../lib/plugins/clean.js');

  beforeEach(function() {
     
    getProjectModel(action, dir, function(model) {
      resources.execute(model, argv, function() {
      });
    });
  });

  afterEach(function() {
    getProjectModel(action, dir, function(model) {
      clean.execute(model, argv, function() {
      });
    });
  });

  it('test less plugin', function() {
    getProjectModel(action, dir, function(model) {
      var src = model.srcDirectory;
      var build = model.buildDirectory;
      // console.info('lesss---->', less);
      // console.info('result---->', jshint.errors);
      // console.info('result---->', result);
    });
  });
});




