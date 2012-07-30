
// 根据用户的action, 分析出插件列表。
// 1. 根据项目类型，返回对应项目的生命周期模型（phrase: plugin),
//    一个阶段能对应一个和多个基本插件。


/**
 * 返回指定类型项目生命周期。
 * @return {Array} 数组，里面包含对应的阶段和插件配置.
 */
exports.getLifecycle = function() {

    // 默认返回基本的生命周期。
    // 目前所有的插件都从 plugins中加载。
  return [{
            'resources': ['resources', 'depCheck']
          }, {
            'build': ['output', 'compress', 'pack']
          }, {
            'upload': ['upload']
          }, {
            'deploy': ['deploy']
          }];
};
