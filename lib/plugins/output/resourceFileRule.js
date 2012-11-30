var path = require('path');

var Rule = require('./rule.js');
var fsExt = require('../../utils/fs_ext.js');
var moduleHelp = require('../../utils/module_help.js');

// 默认合并规则基类.
var rule = Rule.createRule('ResourceDirectoryRule');

rule.check = function(filename, includes) {
  var ext = path.extname(filename);
  return ext && !(moduleHelp.isJs(filename) || moduleHelp.isCss(filename))
};

rule.getIncludes = function(handler, filename, includes, callback) {
  callback(includes);
};

// 静态资源文件只支持 copy 输出，不支持合并。如果发现多个文件，那么只处理第一个。
rule.output = function(ruleHandler, filename, includes, callback) {
  var project = ruleHandler.project;
  var output = ruleHandler.output;

  writeResourceFile(project, filename, includes, callback);
};

// 输出资源文件
// 目前规则暂时简单点. 只支持有限的通配符，和目录深度。或者就是完全匹配正则.
// 'sites': ['sites/*.js'] 把sites/*.js目录中的文件copy到 sites目录.
function writeResourceFile(project, outputFilename, includes) {
  var resourceFile = [];
  var dist = project.distDirectory;
  var build = project.buildDirectory;

  outputFilename = path.join(dist, outputFilename);

  // 文件路径
  fsExt.mkdirS(path.dirname(outputFilename));

  if (_.isArray(includes)) {
    includes = includes[0];
  }

  if (isHttpFile(includes)) {
    var fileStream = fs.createWriteStream(path.join(dist, outputFile));
    fileStream.on('end', function() {
      cb();
    });
    request(includes).pipe(fileStream);
  
  } else {
    fsExt.copyFileSync(outputFilename, build, includes);
    cb();
  }
}

function isHttpFile(f) {
  return f.indexOf('http') == 0;
};

module.exports = rule;


