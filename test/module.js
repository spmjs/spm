var ProjectFactory = require('../lib/core/project_factory.js');

global.getProjectModel = function(action, dir, callback) {
  if (arguments.length === 2) {
    callback = dir;
    dir = action;
    action = 'build';
  }
  var options = {
    "baseDirectory": dir 
  };
    
  ProjectFactory.getProjectModel(action, options, function(projectModel) {
    callback(projectModel);
  });
};
