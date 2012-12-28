module.exports = [{
  'clean': ['clean']
}, {
    'resources': ['resources'] // 代码输出到build目录.
}, {
    'compile': ['transport'] // 代码编译.
}, {
    'output': ['output_transport'] // 合并输出.
}, {
  'build': ['min', 'install']
}, {
  'upload': ['pack', 'upload']
}, {
  'publish': []
}, {
  'deploy': ['deploy'] // 代码部署.
}];

