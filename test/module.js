var ProjectFactory = require('../lib/core/project_factory.js');

global.getProjectModel = function(dir, callback) {
  var options = {
    "baseDirectory": dir 
  };
    
  ProjectFactory.getProjectModel(options, function(projectModel) {
    callback(projectModel);
  });
};
