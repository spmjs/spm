
var devCheck = module.exports = Plugin.create('devCheck');

devCheck.run = function(project, callback) {
  var version = project.version;
  if (/-dev$/.test(version)) {
    callback('find developing project!'); 
  } else {
    console.info('find release project ' + project.name);
    callback();
  }
};


