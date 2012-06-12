
// 项目文件合并
// 其中合并后的文件会存放到 build/dist 目录中。

var path = require('path');
var fs = require('fs');

/**
 * 项目文件合并
 * @param {Object} project 项目模型信息.
 */

exports.execute = function(project) {
    var dist = project.dist;
    if (!dist) {
        throw 'Not found dist meta in __config.js!';
    }

    var buildDirectory = project.buildDirectory;
    var distDirectory = path.join(buildDirectory, 'dist');

    return;
    Object.keys(dist).forEach(function(filename) {
        writeFile(filename, dist[filename], project);
    });
};

// 保存文件，方便文件合并。
DistCache = {

};

function writeFile(filename, fileDeps, project) {

    // 文件路径
    var distfile = path.join(project.distDirectory, filename);
    var fileContent = [];

    if (fileDeps === 'default') {
       fileContent.push(buildFile(filename));
    } else if (Array.isArray(fileDeps)) {
        fileDeps.forEach(function(filename) {
            fileContent.push(buildFile(filename, project));
        });
    } else if (typeof fileDeps === 'string' && /\.js$/.test(fileDeps)) {
        fileContent.push(buildFile(fileDeps, project));
    }

    fs.writeFileSync(distfile, fileContent.join('\r\n\r\n'), 'utf8');
}


