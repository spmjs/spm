
var fs = require('fs');
var path = require('path');
var fsExt = require('../utils/fs_ext.js');


/**
 * 安装项目文件到公共仓库中.
 * @param {Object} project 项目模型对象.
 */
exports.execute = function(project) {
    var globalDistDir = path.join(project.srcDirectory,
            '../../../dist/' + project.id, project.version);
    fsExt.mkdirS(globalDistDir);
    fsExt.copyDirSync(project.distDirectory, globalDistDir);

    console.log('');
    console.log('  Successfully distributed to: ' + globalDistDir);
    console.log('');
};

