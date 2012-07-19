
// 模板替换

/**
 * 读取模板文件，内嵌到项目文件中。减少请求。
 * TODO 在合并文件压缩文件之前做。
 *
 * @param {Object} project 项目模型.
 */
exports.execute = function(project, callback) {
  var tplModPattern = getReqModRegByType('[^\"\']+\\.tpl');

  
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

