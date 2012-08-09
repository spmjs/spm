
// 根据用户的action, 分析出插件列表。
// 每一个阶段会有一个模块，负责本阶段插件的参数信息准备调用和处理.

/**
 * 返回指定类型项目生命周期。
 * @return {Array} 数组，里面包含对应的阶段和插件配置.
 */
exports.getLifecycle = function() {

  // 默认返回基本的生命周期。
  // 目前所有的插件都从 plugins中加载。
  return [{
            'clean': ['clean']
          },{
            'resources': ['resources'] // 代码输出到build目录.
          }, {
            'compile': ['coffee', 'less'], // 代码编译.
          }, {
            'analyse': ['dependencies', 'depCheck'] //依赖分析.
          }, { 
            'preBuild': ['tpl', 'css', 'define'] // 代码模块规范化.
          }, {
            'output': ['output'] // 合并输出.
          }, {
            'build': ['compress', 'install'] // 代码压缩和本地缓存.
          }, {
            'upload': ['pack', 'upload'] // 代码上传源.
          }, {
            'deploy': ['deploy'] // 代码部署.
          }];
};
