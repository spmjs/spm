var ProjectFactory = require('../lib/core/project_factory.js');

global.getProjectModel = function(action, dir, callback) {
  ProjectFactory.getProjectModel(action, dir, function(projectModel) {
    callback(projectModel);
  });
};
