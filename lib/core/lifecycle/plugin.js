module.exports = [{
    'clean': ['clean']
}, {
    'resources': ['resources'] // 代码输出到build目录.
}, {
    'compile': ['coffee', 'json'] // 代码编译.
}, {
    'analyse': ['lint'] //依赖分析.
}, {
    'output': ['output_plugin'] // 合并输出.
}, {
    'build': ['install'] // 代码压缩和本地缓存.
}, {
    'upload': ['pack', 'upload'] // 代码上传源.
}, {
    'publish': []
}, {
    'deploy': ['deploy'] // 代码部署.
}];

