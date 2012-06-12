
var fs = require('fs');
var path = require('path');
var fsExt = require('../utils/fs_ext.js');

exports.execute = function(project) {
    var globalDistDir = path.join(project.srcDirectory, '../../../dist/' + project.id, project.version);
    fsExt.mkdirS(globalDistDir);
    copyDir(project.distDirectory, globalDistDir);
};

var jsFileReg = /\.js$/;

// 后续在copy的过程中，增加过滤的功能。
function copyFile(srcDirectory, buildDirectory, filename) {
    if (!jsFileReg.test(filename)) {
        return;
    }

    var code = fs.readFileSync(path.join(srcDirectory, filename), 'utf8');
console.log('cc-->', srcDirectory, buildDirectory, filename)
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
