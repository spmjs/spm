var path = require('path');
var ProjectFactory = require('../../lib/core/project_factory.js');

describe('project model constructor', function() {
  var action = "build";
  var dir = path.join(path.dirname(module.filename), "../data/modules/moduleA/");
  console.log(dir);
  it('test model create ', function() {
    getProjectModel('build', dir, function(moduleA) {
      expect(moduleA).not.toBe(null);
      expect(moduleA.name).toEqual('moduleA');
      expect(moduleA.version).toEqual('0.9.17');
    });
  });
});

function getProjectModel(action, dir, callback) {
  ProjectFactory.getProjectModel(action, dir, function(projectModel) {
    callback(projectModel);
  });
}
