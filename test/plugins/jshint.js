
var should = require('should');
var path = require('path');
var fsExt = require('../../lib/utils/fs_ext.js');
var jshint = require('jshint').JSHINT;
require('../module.js');

describe('project model constructor', function() {
  var action = "build";
  var dir = path.join(path.dirname(module.filename), "../data/modules/moduleA/");
 
  it('test jshint plugin', function() {
    getProjectModel(dir, function(model) {
      var src = model.srcDirectory;
      var build = model.buildDirectory;
      var result = jshint(fsExt.readFileSync(path.join(src,'widget.js')));
      // console.info('result---->', jshint.errors);
      // console.info('result---->', result);
    });
  });
});

