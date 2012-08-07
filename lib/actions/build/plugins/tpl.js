
// 模板替换

/**
 * 读取模板文件，内嵌到项目文件中。减少请求。
 *
 * @param {Object} project 项目模型.
 */

// 提供 tpl 和 css 是否替换处理插件. 
// 用户可以通过命令和package.json覆盖默认行为.
var argv = require('optimist')
    .usage('Usage: $0 -tpl [tplEmbed]')[
    'default']('tpl', true)
    .argv;

var Plugin = require('../core/plugin.js');

var plugin = module.exports = Plugin.create('tpl');

plugin.param('tpl', true);

plugin.run = function(callback) {
  var project = this.project;
  var tplModPattern = project.getReqModRegByType('[^\"\']+\\.tpl');
  callback();
  return;
  return moduleCode.replace(tplModPattern,
      function(match, mark, tplModName) {
          // 模板内嵌.
          tplModName = path.join(path.dirname(modName), tplModName);
          var tplCode = project.getModuleCode(tplModName);
          tplCode = tplCode.replace(/'/g, '"');
          tplCode = tplCode.replace(spacePattern, '');
          return "'" + tplCode.split('\n').join('') + "'";
      });

};


