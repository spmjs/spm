
// 项目文件合并
// 其中合并后的文件会存放到 build/dist 目录中。
// 在合并后的文件中，会对依赖进行分析处理替换。
// 为了便于方便，在这个里面也会处理文件压缩。

var path = require('path');
var fs = require('fs');
var util = require('util');

var fsExt = require('../utils/fs_ext.js');


/**
 * 项目文件合并
 * @param {Object} project 项目模型信息.
 */
exports.execute = function(project) {
    var dist = project.dist;

    var mergeModules = collectMergeModules(project);
    var includes;
    for (var moduleName in dist) {
        if (dist.hasOwnProperty(moduleName)) {
            includes = dist[moduleName];
            if (/^[_\w-]+$/.test(moduleName) || /.css$/.test(moduleName)) {

                // 检查是否是目录资源文件输出
                writeResourceFile(project, moduleName, includes);
            } else if (includes === 'default') {
                writeCode(project, moduleName, null, mergeModules);

            } else if (util.isArray(includes)) {
                // 输出合并文件
                writeCode(project, moduleName, includes, mergeModules);
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

/**
 * 预先收集合并模块依赖，比如在dist配置中发现
 *  "switchable.js": ["switchable.js", "plugins/autoplay.js", "plugins/effects.js"]
 * 我们会生成 
 *  {switchable.js': ["plugins/autoplay.js", "plugins/effects.js"]}
 * 然后我们在后续打包的模块中，发现有依赖switchable模块的，会从此模块中的依赖
 * 去除包含 switchable.js合并的几个模块.
 */
function collectMergeModules(project) {
    var dist = project.dist;
    var includes;
    var mergeModules = {};
    for (var moduleName in dist) {
        if (dist.hasOwnProperty(moduleName)) {
            includes = dist[moduleName].slice(0);
            if (util.isArray(includes)) {
                // 输出合并文件
                includes.splice(includes.indexOf(moduleName),1);
                var includeIds = [];
                includes.forEach(function(include) {
                    includeIds.push(project.getModuleId(include));
                });
                mergeModules[project.getModuleId(moduleName)] = includeIds;
                mergeModules[project.getModuleId(moduleName) + '-debug'] = includeIds.map(function(include) {
                    return include + '-debug';
                });
            }
        }
    }
    return mergeModules;
}

// 输出文件
function writeCode(project, moduleName, includes, mergeModules) {
    var minfile = path.join(project.distDirectory, moduleName);
    var debugfile = minfile.replace('.js', '-debug.js');
    var files = collectIncludeCode(project, moduleName, includes, mergeModules);

    fsExt.writeFileSync(debugfile, files.debugCode);
    fsExt.writeFileSync(minfile, files.minCode);

    project.compress(minfile, function(code) {
        fsExt.writeFileSync(minfile, code);
    });

    if (project.aliasMobile) {
        var mobileFile = minfile.replace('.js', '-mobile.js');
        var mobileDebugFile = minfile.replace('.js', '-mobile-debug.js');
        fsExt.writeFileSync(mobileDebugFile, files.mobileDebugCode);
        fsExt.writeFileSync(mobileFile, files.mobileCode);
        project.compress(mobileFile, function(code) {
            fsExt.writeFileSync(mobileFile, code);
        });
    }
}

// 收集需要合并的文件.
function collectIncludeCode(project, moduleName, includes, mergeModules) {
    if (!includes) {
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
            baseDepList,
            debugDepList,
            mobileDebugCode,
            mobileMinCode,
            mobileDepList,
            mobileDebugDepList;

        baseCode = project.getModuleCode(moduleName);
        moduleId = project.getModuleId(moduleName);

        baseCode = filterTplRequire(project, moduleName, baseCode);

        baseDebugCode = filterLocalRequire(project,
                moduleName, baseCode, '-debug');

        baseMinCode = filterLocalRequire(project, moduleName, baseCode, '');

        baseDepList = project.getModuleDepMapping(moduleId);
        debugDepList = baseDepList.map(function(dep) {
            return dep + '-debug';
        });
//console.log(moduleId, baseDepList)

        debugCode = filterGlobalRequire(project,
                moduleName, baseDebugCode, '-debug');

        minCode = filterGlobalRequire(project, moduleName, baseMinCode, '');

        debugCode = filterIdAndDeps(debugCode,
                moduleId + '-debug', getDepStr(moduleId + '-debug', debugDepList, mergeModules));

        minCode = filterIdAndDeps(minCode, moduleId, getDepStr(moduleId, baseDepList, mergeModules));

        debugCodeList.push(debugCode);
        minCodeList.push(minCode);

        if (aliasMobile) {
            mobileDebugCode = filterMobileRequire(project,
                    moduleName, baseDebugCode, '-debug');

            mobileMinCode = filterMobileRequire(project,
                    moduleName, baseMinCode, '');

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

            mobileDebugCode = filterMobileRequire(project,
                    moduleName, baseDebugCode, '-debug');

            mobileMinCode = filterMobileRequire(project,
                    moduleName, baseMinCode, '');

            mobileDebugCode = filterIdAndDeps(mobileDebugCode,
                    moduleId + '-mobile-debug', getDepStr(moduleId + '-mobile-debug', mobileDebugDepList, mergeModules));

            mobileMinCode = filterIdAndDeps(mobileMinCode,
                    moduleId + '-mobile', getDepStr(moduleId + '-mobile', mobileDepList, mergeModules));

            debugMobileCode.push(mobileDebugCode);
            mobileCode.push(mobileMinCode);
        }
    });

    if (debugMobileCode.length) {
        debugMobileCode = debugMobileCode.join('\n\n');
        //mobileCode = compress(mobileCode.join('\n\n'));
        mobileCode = mobileCode.join('\n\n');
    } else {
        debugMobileCode = null;
        mobileCode = null;
    }

    return {
        debugCode: debugCodeList.join('\n\n'),
        //minCode: compress(minCodeList.join('\n\n')),
        minCode: minCodeList.join('\n\n'),
        mobileDebugCode: debugMobileCode,
        mobileCode: mobileCode
    };
}


// 保存分析好的文件，避免出现parse重复的模块。
var ModuleCodeCache = {

};

//var tplModuleNamePattern =
// /(?:^|[^.])\brequire\s*\(\s*(["'])([^"'\s\)]+\.tpl)\1\s*\)/g;
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

        return ' require("' + getRequireId.call(project,
                modName, depModName) + '")';
    });
}

function filterIdAndDeps(code, moduleId, deps) {

    return code.replace('define(function',
            'define("' + moduleId + '", [' + deps + '], function');
}

function getDepStr(moduleId, depList, mergeModules) {
    depList = depList.slice(0);
    if (Object.keys(mergeModules).length > 0) {
        for (var module in mergeModules) {
            if (moduleId === module) {
                continue;
            }
            if (depList.indexOf(module) > -1) {
                delMergeModule(depList, mergeModules[module]);
            }
        }
    }
    return depList.length ? '"' + depList.join('", "') + '"' : '';
}

// 在依赖关系中排除已经合并到文件中的模块.
function delMergeModule(depList, modules) {
    modules.forEach(function(module) {
        var index = depList.indexOf(module);
        if (index > -1) {
            depList.splice(index, 1);
        }
    });
}

// TODO 正则常量统一维护.
// var moduleNamePattern =
// /(?:^|[^.])\brequire\s*\(\s*(["'])([^"'\s\)]+)\1\s*\)/g;

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
                    depModuleName = path.join(path.dirname(moduleName),
                            depModuleName);

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

/**
 * 获取指定类型的正则.
 * @param {String} moduleType 具体模块类型正则.
 * @return {RegExp} 返回对应类型正则.
 */
function getReqModRegByType(moduleType) {
    return new RegExp('(?:^|[^.])\\brequire\\s*\\(\\s*(["\'])(' +
            moduleType + ')\\1\\s*\\)', 'g');
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
            resourceFile = resourceFile.concat(getResourceFile(project,
                    include));
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


