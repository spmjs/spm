
// TODO 检查模块代码中是否包含coffee文件，如果包含怎对整个项目的文件进行提前编译和替换.

var Plugin = require('../core/plugin.js');

module.exports = Plugin.create('coffee');


function isCoffee(filepath) {
  return path.extname(filepath) === '.coffee';
}

