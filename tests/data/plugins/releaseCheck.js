
// 清除工作空间，build, temp目录.
var path = require('path');

var releaseCheck = module.exports = Plugin.create('releaseCheck');
var CONFIG = "debug";

releaseCheck.run = function(callback) {
  var project = this.project; 
  console.info('this.version-------->', project.version);
  callback();
};

