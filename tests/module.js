var ProjectFactory = require('../lib/core/project_factory.js');
var Action = require('../lib/core/action.js');

global.getProjectModel = function(action, dir, callback) {
  if (arguments.length === 2) {
    callback = dir;
    dir = action;
    action = 'build';
  }
  var options = Action.prototype.createOptions({
    "base": dir 
  });
    
  ProjectFactory.getProjectModel(action, options, function(projectModel) {
    callback(projectModel);
  });
};
