// 源文件copy, 把源文件copy到工作目录。
// 后续可以支持filter功能，可以针对指定的文件进行过滤和替换

// TODO 过滤和基本的项目信息替换.

var fs = require('fs');
var path = require('path');


/**
 * 根据项目不同的类型，可能有基本不同的过滤规则。
 * @param {Object} project 项目模型信息.
 */
exports.execute = function(project) {
    copyDir(project.srcDirectory, project.buildDirectory);
};

var jsFileReg = /\.js$/;

// 后续在copy的过程中，增加过滤的功能。
function copyFile(srcDirectory, buildDirectory, filename) {
    if (!jsFileReg.test(filename)) {
        return;
    }

    var code = fs.readFileSync(path.join(srcDirectory, filename), 'utf8');
    fs.writeFileSync(path.join(buildDirectory, filename), code, 'utf8');
}

function copyDir(srcDirectory, buildDirectory) {
    var files = fs.readdirSync(srcDirectory);

    files.forEach(function(filename) {
        var stat = fs.statSync(path.join(srcDirectory, filename));

        if (stat.isFile()) {
            copyFile(srcDirectory, buildDirectory, filename);
        } else if (stat.isDirectory()) {
            var fileDir = path.join(buildDirectory, filename);
            !path.existsSync(fileDir) && fs.mkdirSync(fileDir);
            copyDir(path.join(srcDirectory, filename),
                path.join(buildDirectory, filename));
        }
    });
}
