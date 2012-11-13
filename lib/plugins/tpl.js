// 读取模板文件，内嵌到项目文件中。减少请求。
// 用户可以通过命令和package.json覆盖默认行为.

var path = require('path');
var fsExt = require('../utils/fs_ext.js');
var Plugin = require('../core/plugin.js');

var plugin = module.exports = Plugin.create('tpl');

plugin.param('tpl', true, 'inline template file.');

plugin.run = function(project, callback) {
  if (!this.tpl) {
    callback();
    return;
  }

  var build = project.buildDirectory;
  var tplModPattern = project.getReqModRegByType('[^\"\']+\\.(?:tpl|htm|html)', false);

  files = fsExt.list(build, /\.js$/).forEach(function(file) {
    var filepath = path.join(build, file);
    code = fsExt.readFileSync(filepath);
    if (tplModPattern.test(code)) {
      code = filterTplRequire(filepath, code, project);
      fsExt.writeFileSync(filepath, code);
    }
  });

  callback();
};

var spacePattern = /^[\s\t]*|[\s\t]$/gm;
function filterTplRequire(filepath, code, project) {
  var tplModPattern = project.getReqModRegByType('[^\"\']+\\.(?:tpl|html|htm)');
  return code.replace(tplModPattern, function(match, sep, mark, depModName) {
    var tplFilepath = project.getDepModulePath(filepath, depModName);
    var tplCode = fsExt.readFileSync(tplFilepath);

    // tplCode = tplCode.replace(/'/g, '"');
    tplCode = tplCode.replace(/'/g, function(m, pos, str) {
      if (pos > 0 && str.charAt(pos - 1) === '\\') {
        // 被转义，不进行引号替换.
        return m;
      }

      return '\\\'';
    });
    tplCode = tplCode.replace(spacePattern, '');
    return sep + "'" + tplCode.split('\n').join(' ') + "'";
  });
}
