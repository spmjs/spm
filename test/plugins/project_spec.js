var path = require('path');

describe('project model constructor', function() {
  var action = "build";
  var dir = path.join(path.dirname(module.filename), "../data/modules/moduleA/");
  console.log(dir);
  it('model object create test', function() {
    getProjectModel(action, dir, function(moduleA) {
      expect(moduleA).not.toBe(null);
      expect(moduleA.name).toEqual('moduleA');
      expect(moduleA.version).toEqual('0.9.17');
    });
  });
});

