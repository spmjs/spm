module.exports = [{
    'clean': ['clean']
}, {
    'resources': ['resources', 'combine'] // 代码输出到build目录.
}, {
    'compile': ['coffee', 'less', 'transport', 'json'] // 代码编译.
}, {
    'analyse': ['lint','dependencies', 'depCheck'] //依赖分析.
}, {
    'preBuild': ['tpl', 'css'] // 代码模块规范化.
}, {
    'output': ['output'] // 合并输出.
}, {
    'build': ['min', 'install', 'zip'] // 代码压缩和本地缓存.
}, {
    'upload': ['pack', 'upload'] // 代码上传源.
}, {
    'publish': []
}, {
    'deploy': ['deploy'] // 代码部署.
}];
