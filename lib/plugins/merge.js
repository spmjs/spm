
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

    Object.keys(dist).forEach(function(filename) {
        console.log('11----->' + filename);
        writeFile(filename, dist[filename], project);
        console.log('21----->' + filename);
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

function buildFile(filename, project) {

console.log(filename + 'filename');
    if (DistCache[filename]) {
        return DistCache[filename];
    }

    var code = fs.readFileSync(path.join(project.buildDirectory,
                filename), 'utf8');

    // 得到 id 和 deps 信息
    var id = '#' + project.id + '/' +
        project.version + '/' + filename.split('.')[0];

    var deps = parseDependencies(code);
    deps = deps.length ? '"' + deps.join('","') + '"' : '';

    // 获取源码
    code = code.replace('define(function',
            'define("' + id + '", [' + deps + '], function');

    return DistCache[filename] = code;
}


function parseDependencies(code) {
    var pattern = /(?:^|[^.])\brequire\s*\(\s*(["'])([^"'\s\)]+)\1\s*\)/g;
    var ret = [], match;

    code = removeComments(code);
    while ((match = pattern.exec(code))) {
        if (match[2]) {
            ret.push(match[2]);
        }
    }

    return unique(ret);
}

function removeComments(code) {
    return code
            .replace(/(?:^|\n|\r)\s*\/\*[\s\S]*?\*\/\s*(?:\r|\n|$)/g, '\n')
            .replace(/(?:^|\n|\r)\s*\/\/.*(?:\r|\n|$)/g, '\n');
}

function unique(arr) {
    var o = {};
    arr.forEach(function(item) {
        o[item] = 1;
    });

    return Object.keys(o);
}
