
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
    for (var moduleName in dist) {
        if (dist.hasOwnProperty(moduleName)) {
            includes = dist[moduleName];
            if (/^[_\w-]+$/.test(moduleName) || /.css$/.test(moduleName)) {

                // 检查是否是目录资源文件输出
                writeResourceFile(project, moduleName, includes);
            } else if (includes === 'default') {
                writeCode(project, moduleName);

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

    if (project.aliasMobile) {
        var mobileFile = minfile.replace('.js', '-mobile.js');
        var mobileDebugFile = minfile.replace('.js', '-mobile-debug.js');
        fsExt.writeFileSync(mobileDebugFile, files.mobileDebugCode);
        fsExt.writeFileSync(mobileFile, files.mobileCode);
    }
}

// 收集需要合并的文件.
function collectIncludeCode(project, moduleName, includes) {
    if (typeof includes === 'undefined') {
        includes = [moduleName];
    }

    var aliasMobile = project.aliasMobile;
    var debugCodeList = [];
    var minCodeList = [];
    var debugMobileCode = [];
    var mobileCode = [];
    includes.forEach(function(moduleName) {
        var baseCode,
            baseDebugCode,
            baseMinCode,
            debugCode,
            minCode,
            moduleId,
            distModId,
            baseDepList,
            debugDepList,
            mobileDebugCode,
            mobileMinCode,
            mobileDepList,
            mobileDebugDepList;

        baseCode = project.getModuleCode(moduleName);
        moduleId = project.getModuleId(moduleName);
        distModId = project.getDistModuleId(moduleName);

        baseCode = filterTplRequire(project, moduleName, baseCode);

        baseDebugCode = filterLocalRequire(project, moduleName, baseCode, '-debug');
        baseMinCode = filterLocalRequire(project, moduleName, baseCode, '');

        baseDepList = project.getModuleDepMapping(moduleId);
        debugDepList = baseDepList.map(function(dep) {
            return dep + '-debug';
        });

        debugCode = filterGlobalRequire(project, moduleName, baseDebugCode, '-debug');
        minCode = filterGlobalRequire(project, moduleName, baseMinCode, '');

        debugCode = filterIdAndDeps(debugCode, moduleId + '-debug', getDepStr(debugDepList));
        minCode = filterIdAndDeps(minCode, moduleId, getDepStr(baseDepList));

        debugCodeList.push(debugCode);
        minCodeList.push(minCode);

        if (aliasMobile) {
            mobileDebugCode = filterMobileRequire(project, moduleName, baseDebugCode, '-debug');
            mobileMinCode = filterMobileRequire(project, moduleName, baseMinCode, '');
            mobileDepList = baseDepList.slice(0);

            Object.keys(aliasMobile).forEach(function(modName) {
                var mobileId = project.getMobileModuleId(modName);
                var modId = project.getGlobalModuleId(modName);
                var index = mobileDepList.indexOf(modId);
                if (index > -1) {
                    mobileDepList.splice(index, 1, mobileId);
                }
            });

            mobileDebugDepList = mobileDepList.map(function(dep) {
                return dep + '-debug';
            });

            mobileDebugCode = filterMobileRequire(project, moduleName, baseDebugCode, '-debug');
            mobileMinCode = filterMobileRequire(project, moduleName, baseMinCode, '');

            mobileDebugCode = filterIdAndDeps(mobileDebugCode, moduleId + '-mobile-debug', getDepStr(mobileDebugDepList));
            mobileMinCode = filterIdAndDeps(mobileMinCode, moduleId + '-mobile', getDepStr(mobileDepList));
            debugMobileCode.push(mobileDebugCode);
            mobileCode.push(mobileMinCode);
        }
    });

    if (debugMobileCode.length) {
        debugMobileCode = debugMobileCode.join('\n\n');
        mobileCode = compress(mobileCode.join('\n\n'));
    } else {
        debugMobileCode = null;
        mobileCode = null;
    }

    return {
        debugCode: debugCodeList.join('\n\n'),
        minCode: compress(minCodeList.join('\n\n')),
        mobileDebugCode: debugMobileCode,
        mobileCode: mobileCode
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
var ModuleCodeCache = {

};

//var tplModuleNamePattern = /(?:^|[^.])\brequire\s*\(\s*(["'])([^"'\s\)]+\.tpl)\1\s*\)/g;
// 过滤模板
function filterTplRequire(project, modName, moduleCode) {
    var tplModPattern = getReqModRegByType('[^\"\']+\\.tpl');

    return moduleCode.replace(tplModPattern,
            function(match, mark, tplModName) {
                    // 模板内嵌.
                    tplModName = path.join(path.dirname(modName), tplModName);
                    var tplCode = project.getModuleCode(tplModName);
                    tplCode = tplCode.replace(/'/g, '"');
                    tplCode = tplCode.replace(spacePattern, '');
                    return "'" + tplCode.split('\n').join('') + "'";
            });
}

function filterLocalRequire(project, modName, modCode, debug) {
    // 对代码文件中依赖的模块，进行替换. 替换为全路径.
    var modPattern = getReqModRegByType('\\.[^\"\']+');

    return filterRequire(project, modPattern, modName, modCode,
        function(modName, depModName) {
            if (/\.css$/.test(depModName)) {
                return this.getCssDepModuleId(modName, depModName);
            }
            return this.getDepModuleId(modName, depModName) + debug;
        });
}


function filterGlobalRequire(project, modName, modCode, debug) {
    var modPattern = getReqModRegByType('[-\\w$]+');
    return filterRequire(project, modPattern, modName, modCode,
            function(modName, depModName) {
                return this.getGlobalModuleId(depModName) + debug;
            });
}

function filterMobileRequire(project, modName, modCode, debug) {
    var modPattern = getReqModRegByType('[a-wA-W$]+');

    return filterRequire(project, modPattern, modName, modCode,
            function(modName, depModName) {
                return this.getMobileModuleId(depModName) + debug;
            });
}

function filterRequire(project, pattern, modName, code, getRequireId) {
    return code.replace(pattern, function(match, mark, depModName) {

        // HACK css暂时不处理.
        /**
        if (depModName.indexOf('css') > 0) {
            console.log(match);
            return match;
        }
        **/

        return ' require("' + getRequireId.call(project, modName, depModName) + '")';
    });
}

function filterIdAndDeps(code, moduleId, deps) {

    return code.replace('define(function',
            'define("' + moduleId + '", [' + deps + '], function');
}

function getDepStr(depList) {

    return depList.length ? '"' + depList.join('", "') + '"' : '';
}

// TODO 正则常量统一维护.
//var moduleNamePattern = /(?:^|[^.])\brequire\s*\(\s*(["'])([^"'\s\)]+)\1\s*\)/g;

var spacePattern = /^[\s\t]*|[\s\t]$/gm;

/**
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

                if (depModuleName.indexOf('.tpl') > 0) {
                    // 模板内嵌.
                    depModuleName = path.join(path.dirname(moduleName), depModuleName);
                    var tplCode = project.getModuleCode(depModuleName);
                    tplCode = tplCode.replace(/'/g, '"');
                    tplCode = tplCode.replace(spacePattern, '');
                    return "'" + tplCode.split('\n').join('') + "'";

                } else if (depModuleName.indexOf('.') === 0) {

                    //内部模块依赖
                    moduleId = project.getDepModuleId(moduleName,
                            depModuleName);
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
**/

function getReqModRegByType(moduleType) {
    return new RegExp('(?:^|[^.])\\brequire\\s*\\(\\s*(["\'])(' + moduleType + ')\\1\\s*\\)', 'g');
}

// 输出资源文件
// 目前规则暂时简单点. 只支持有限的通配符，和目录深度。或者就是完全匹配正则.
// 'sites': ['sites/*.js'] 把sites/*.js目录中的文件copy到 sites目录.
function writeResourceFile(project, resourceDir, includes) {
    var resourceFile = [];

    var resDirPath = path.join(project.distDirectory, resourceDir);
    if (includes === 'default') {
        fsExt.writeFileSync(resDirPath, project.getModuleCode(resourceDir));
    } else {

        // 文件路径
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

// 需要插入parent类型
function getModuleId(id, parentType) {
    if (id.indexOf('#') === 0) {
        id = id.slice(1);
    }
    return '#' + parentType + '/' + id.slice(1);
}


