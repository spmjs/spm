
var path = require('path');
var ProjectFactory = require('../../../lib/actions/build/core/project_factory.js');
var fsExt = require('../../../lib/utils/fs_ext.js');
var less = require('less');
describe('less project test', function() {
  var action = "build";
  var dir = path.join(path.dirname(module.filename), "./datas/lessModule/");
 
  var lessPlugin = require('../../../lib/actions/build/plugins/less.js');
  var resources = require('../../../lib/actions/build/plugins/resources.js');
  var clean = require('../../../lib/actions/build/plugins/clean.js');

  beforeEach(function() {
     
    getProjectModel('build', dir, function(model) {
      resources.execute(model, function() {
      });
    });
  });

  afterEach(function() {
    getProjectModel('build', dir, function(model) {
      clean.execute(model, function() {
      });
    });
  });

  it('test less plugin', function() {
    getProjectModel('build', dir, function(model) {
      var src = model.srcDirectory;
      var build = model.buildDirectory;
      console.info('lesss---->', less);
      // console.info('result---->', jshint.errors);
      // console.info('result---->', result);
    });
  });
});

function getProjectModel(action, dir, callback) {
  ProjectFactory.getProjectModel(action, dir, function(projectModel) {
    callback(projectModel);
  });
}



