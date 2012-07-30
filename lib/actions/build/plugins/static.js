
// 模板替换

/**
 * 读取模板文件，内嵌到项目文件中。减少请求。
 * TODO 在合并文件压缩文件之前做。
 *
 * @param {Object} project 项目模型.
 */

// 提供 tpl 和 css 是否替换处理插件. 
// 用户可以通过命令和package.json覆盖默认行为.
var argv = require('optimist')
    .usage('Usage: $0 -tpl [tplEmbed] -css [cssEmbed]') 
    .default('tpl', true)
    .default('css', true)
    .argv;


module.exports = function(project, callback) {
  var tplModPattern = project.getReqModRegByType('[^\"\']+\\.tpl');
  var cssModPattern = project.getReqModRegByType('[^\"\']+\\.css');
   
  return moduleCode.replace(tplModPattern,
      function(match, mark, tplModName) {
          // 模板内嵌.
          tplModName = path.join(path.dirname(modName), tplModName);
          var tplCode = project.getModuleCode(tplModName);
          tplCode = tplCode.replace(/'/g, '"');
          tplCode = tplCode.replace(spacePattern, '');
          return "'" + tplCode.split('\n').join('') + "'";
      });

  console.log('');
  console.log('  Successfully execute plugin template!');
  console.log('');
  callback();
};

