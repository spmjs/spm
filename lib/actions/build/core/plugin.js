
function Plugin(project, config) {
  this.project = project;
  this.config = config;
}

Plugin.prototype.run = function() {
  throw 'abstract method!';
};

module.exports = Plugin;
