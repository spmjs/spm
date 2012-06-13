
// 项目文件合并
// 其中合并后的文件会存放到 build/dist 目录中。
// 在合并后的文件中，会对依赖进行分析处理替换。
// 为了便于方便，在这个里面也会处理文件压缩。

var path = require('path');
var fs = require('fs');

var uglifyjs = require('uglify-js');
var jsp = uglifyjs.parser;
var pro = uglifyjs.uglify;

var fsExt = require('../utils/fs_ext.js');

/**
 * 项目文件合并
 * @param {Object} project 项目模型信息.
 */

exports.execute = function(project) {
    var dists = project.dist;
    for (distName in dists) {
        if (dists.hasOwnProperty(distName)) {
            distValue = dists[distName];
            if (distValue === 'default') {
                writeCode(project, distName);
                continue;
            }
            if (util.isArray(distValue)) {

                distValue.forEach(function(moduleName) {

                    // 判断是否是资源文件，我们的资源文件的输出，也是在dist里面配置。
                    if (moduleName.lastIndexOf(type) !=
                            (moduleName.length - type.length)) {
                        return;
                    }

                    !(~moduleList.indexOf(moduleName)) &&
                            moduleList.push(moduleName);
                });
            }
        }
    }

    console.log('');
    console.log('  Successfully build project!');
    console.log('');
};

// 输出文件
function writeCode(project, moduleName) {
    var debugCode = parseModuleCode(project, moduleName, '-debug');
    var minCode = compress(parseModuleCode(project, moduleName, ''));

    var minfile = path.join(project.distDirectory, moduleName);
    var debugfile = minfile.replace('.js', '-debug.js');

    fsExt.writeFileSync(debugfile, debugCode);
    fsExt.writeFileSync(minfile, minCode);
}

function compress(code) {
    var ast = jsp.parse(code);

    ast = pro.ast_mangle(ast);
    ast = pro.ast_squeeze(ast);

    return pro.gen_code(ast) + ';';
}

var moduleNamePattern = /(?:^|[^.])\brequire\s*\(\s*(["'])([^"'\s\)]+)\1\s*\)/g;

// 对模块进行依赖分析和替换
var parseModuleCode = function(project, moduleName, debug) {
    var that = this;
    var moduleCode = fsExt.readFileSync(project.buildDirectory, moduleName);
    var moduleId = project.getModuleId(moduleName);
    var depList = project.moduleDepMapping[moduleId];

    // 对代码文件中依赖的模块，进行替换. 替换为全路径.
    moduleCode = moduleCode.replace(moduleNamePattern,
            function(match, mark, depModuleName) {
                var moduleId;
                var globalModuleDeps;

                if (depModuleName.indexOf('.') === 0) {

                    //内部模块依赖
                    moduleId = project.getDepModuleId(moduleName,
                            depModuleName);
                } else {
                    moduleId = project.getGlobalModuleId(depModuleName);
                }
                return ' require("' + moduleId + debug + '")';
            });

    if (debug) {
        var debugDepList = [];
        depList.forEach(function(dep) {
            debugDepList.push(dep + debug);
        });
        depList = debugDepList;
    }
    depList = depList.length ? '"' + depList.join('", "') + '"' : '';
    return moduleCode.replace('define(function',
            'define("' + moduleId + debug + '", [' + depList + '], function');
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


