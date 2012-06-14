
// 项目文件合并
// 其中合并后的文件会存放到 build/dist 目录中。
// 在合并后的文件中，会对依赖进行分析处理替换。
// 为了便于方便，在这个里面也会处理文件压缩。

var path = require('path');
var fs = require('fs');
var util = require('util');

var uglifyjs = require('uglify-js');
var jsp = uglifyjs.parser;
var pro = uglifyjs.uglify;

var fsExt = require('../utils/fs_ext.js');

/**
 * 项目文件合并
 * @param {Object} project 项目模型信息.
 */
exports.execute = function(project) {
    var dist = project.dist;
    var includes;
    for (moduleName in dist) {

        if (dist.hasOwnProperty(moduleName)) {
            includes = dist[moduleName];
            if (includes === 'default') {
                writeCode(project, moduleName);

            } else if (/^[_\w-]+$/.test(moduleName)) {

                // 检查是否是目录资源文件输出
                writeResourceFile(project, moduleName, includes);

            } else if (util.isArray(includes)) {
                // 输出合并文件
                writeCode(project, moduleName, includes);
            } else {
                console.error('dist parse error!');
                console.error(moduleName + ': ' + includes);
            }
        }
    }
    console.log('');
    console.log('  Successfully build project!');
    console.log('');
};

// 输出文件
function writeCode(project, moduleName, includes) {
    var minfile = path.join(project.distDirectory, moduleName);
    var debugfile = minfile.replace('.js', '-debug.js');
    var files = collectIncludeCode(project, moduleName, includes);

    fsExt.writeFileSync(debugfile, files.debugCode);
    fsExt.writeFileSync(minfile, files.minCode);
}

// 收集需要合并的文件.
function collectIncludeCode(project, moduleName, includes) {
    if (typeof includes === 'undefined') {
        includes = [moduleName];
    }
    var buildTime = 'build time: ' + new Date();
    var debugCodeList = [];
    var minCodeList = [];

    includes.forEach(function(include) {
        var debugCode = parseModuleCode(project, include, '-debug');
        var minCode = parseModuleCode(project, include, '');
        debugCodeList.push(debugCode);
        minCodeList.push(minCode);
    });

    return {
        debugCode: debugCodeList.join('\n\n'),
        minCode: compress(minCodeList.join('\n\n'))
    };
}

// 代码压缩.
function compress(code) {
    var ast = jsp.parse(code);

    ast = pro.ast_mangle(ast);
    ast = pro.ast_squeeze(ast);

    return pro.gen_code(ast) + ';';
}

// 保存分析好的文件，避免出现parse重复的模块。
ModuleCodeCache = {

};

// TODO 正则常量统一维护.
var moduleNamePattern = /(?:^|[^.])\brequire\s*\(\s*(["'])([^"'\s\)]+)\1\s*\)/g;

// 对模块进行依赖分析和替换
var parseModuleCode = function(project, moduleName, debug) {
    var that = this;
    var moduleCode = project.getModuleCode(moduleName);
    var moduleId = project.getModuleId(moduleName);
    var depList = project.getModuleDepMapping(moduleId);

    // 对代码文件中依赖的模块，进行替换. 替换为全路径.
    moduleCode = moduleCode.replace(moduleNamePattern,
            function(match, mark, depModuleName) {
                var moduleId;
                var globalModuleDeps;

                if (depModuleName.indexOf('.') === 0) {

                    //内部模块依赖
                    moduleId = project.getDepModuleId(moduleName,
                            depModuleName);
                } else if (depModuleName.indexOf('.tpl') > 0) {

                    // TODO 是否支持参数配置，来决定是否内嵌，
                    // 模板内嵌.
                } else {
                    moduleId = project.getGlobalModuleId(depModuleName);
                }
                return ' require("' + moduleId + debug + '")';
            });

    if (debug) {
        depList = depList.map(function(dep) {
            return dep + debug;
        });
    }

    depList = depList.length ? '"' + depList.join('", "') + '"' : '';

    return moduleCode.replace('define(function',
            'define("' + moduleId + debug + '", [' + depList + '], function');
};

// 输出资源文件
// 目前规则暂时简单点. 只支持有限的通配符，和目录深度。或者就是完全匹配正则.
// 'sites': ['sites/*.js'] 把sites/*.js目录中的文件copy到 sites目录.
function writeResourceFile(project, resourceDir, includes) {
    var resourceFile = [];

    // 文件路径
    var resDirPath = path.join(project.distDirectory, resourceDir);
    fsExt.mkdirS(resDirPath);

    if (typeof includes === 'string') {
        includes = [includes];
    }

    includes.forEach(function(include) {
        resourceFile = resourceFile.concat(getResourceFile(project, include));
    });
    resourceFile.forEach(function(filename) {
        var filenamePath = path.join(resDirPath, path.basename(filename));
        fsExt.writeFileSync(filenamePath, project.getModuleCode(filename));
    });
}

function getResourceFile(project, filename) {
    var resourceDir;
    if (filename.indexOf('*') > 0) {
        var resourceFileDir = path.dirname(filename);
        resourceDir = path.join(project.buildDirectory, resourceFileDir);
        return fs.readdirSync(resourceDir).map(function(filename) {
            return path.join(resourceFileDir, filename);
        });
    } else {
        return [filename];
    }
}


