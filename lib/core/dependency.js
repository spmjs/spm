// 依赖分析
// 在这个模块里面，会对所有的模块进行依赖分析，命名替换等操作。

var util = require('util');
var path = require('path');

var splice = Array.prototype.splice;

var fsExt = require('../utils/fs_ext.js');

function Dependency(project) {
    this.project = project;
    this.srcDir = project.srcDirectory;
}

/**
 * 获取项目所有模块直接的依赖关系
 * { '#widget/0.9.13/templatable':
 *    [ '#jquery/1.7.2/jquery',
 *      '#handlebars/1.0.0/handlebars',
 *      '#widget/0.9.13/ast-printer'
 *     ]
 * }
 *
 * @return {Object} 模块依赖关系.
 */
Dependency.prototype.getModuleDepMapping = function() {
    if (!this.moduleDepMapping) {
        this.initModuleDepMapping();
    }
    return this.moduleDepMapping;
};

/** 初始化项目中具体的模块文件和最终的模块ID的对应关系.
 * {
 *  'switchable.js': ['#jquery/1.7.2/jquery',
 *          '#widget/0.9.4/widget', './plugin/auto.js']
 * }
*/
Dependency.prototype.initModuleDepMapping = function() {
    var that = this;
    var moduleList = this.project.moduleList;
    var moduleDepMapping = this.moduleDepMapping = {};

    // 分类计算出global dep, local dep, tpl.
    var moduleAllDepMapping = {};

    // 先计算出所有的模块的内部依赖和全局依赖，然后在

    moduleList.forEach(function(moduleName) {
        moduleAllDepMapping[that.getModuleId(moduleName)] =
                that.getModuleAllDepMapping(moduleName);
    });

    // 当所有的模块分析完成后, 对本地模块依赖进行分析，计算出整个依赖路径
    // 目前打算先计算具
    Object.keys(moduleAllDepMapping).forEach(function(moduleId) {
        that.parseLocalDeps(moduleAllDepMapping, moduleId);
    });

    Object.keys(moduleAllDepMapping).forEach(function(moduleId) {
        moduleDepMapping[moduleId] = that.getAllDeps(moduleAllDepMapping,
                moduleId);
    });
};

/**
 * 获取moduleId
 * @param {String} moduleName 模块名称.
 * @return {String} 模块ID.
 */
Dependency.prototype.getModuleId = function(moduleName) {
    return this.project.getModuleId(moduleName);
};

/**
 * 获取内部模块依赖的id, 主要是需要计算相对路径.
 * @param {Object} activeModule 当前模块.
 * @param {String} moduleName 依赖的内部模块名称.
 * @return {String} 模块ID.
 */
Dependency.prototype.getDepModuleId = function(activeModule, moduleName) {
    return this.project.getDepModuleId(activeModule, moduleName);
};

/**
 * 循环计算所有的内部依赖.
 * @param {Object} moduleAllDepMapping 模块的整个依赖关系.
 * @param {String} moduleId 模块ID.
 */
Dependency.prototype.parseLocalDeps = function(moduleAllDepMapping, moduleId) {
    var subModuleName,
        subModuleId,
        subModuleDeps;
    var that = this;

    var local = moduleAllDepMapping[moduleId].local;
    var moduleName = moduleAllDepMapping[moduleId].moduleName;
    while (subModuleName = local.shift()) {
        if (subModuleName.indexOf('#') === 0) {
            local.unshift(subModuleName);
            break;
        }
        subModuleId = this.getDepModuleId(moduleName, subModuleName);
        local.push(subModuleId);
        subModuleDeps = moduleAllDepMapping[subModuleId].local;

        if (subModuleDeps.length > 0 && subModuleDeps[0].indexOf('#') === 0) {
            // 此模块已经替换过，直接加入
            //console.log('su----', subModuleDeps)
            splice.apply(local, [local.length, 0].concat(subModuleDeps));
        } else {
            subModuleDeps.forEach(function(subModule) {

                if (that.getDepModuleId(subModuleName, subModule) === subModuleId) {

                    // 发现循环依赖
                    return;
                }
                local.unshift(path.join(path.dirname(subModuleName), subModule));
            });
        }
    }
    moduleAllDepMapping[moduleId].local = unique(moduleAllDepMapping[moduleId].local);
};

/**
 * 返回指定模块的整个依赖关系，包括全局和内部.
 * @param {Object} moduleAllDepMapping 项目所有模块的依赖关系映射表.
 * @param {String} moduleId 模块ID.
 * @return {Array} 返回对应模块的依赖关系.
 */
Dependency.prototype.getAllDeps = function(moduleAllDepMapping, moduleId) {
    var local = moduleAllDepMapping[moduleId].local;
    var allDeps = moduleAllDepMapping[moduleId].global.slice(0);

    local.forEach(function(subLocalModuleId) {
        allDeps.push(subLocalModuleId);
        var subModuleGlobalDep = moduleAllDepMapping[subLocalModuleId].global;
        [].splice.apply(allDeps,
                [allDeps.length, 0].concat(subModuleGlobalDep));
    });

    return unique(allDeps);
};

/**
 * 分析给定模块的依赖关系. 并把相应的依赖转换为模块id.
 * 并根据依赖的内容，保存在global, local, tpl三部分
 * @param {String} moduleName 模块名称.
 * @return {Object} 返回项目指定模块的整个依赖关系.
 */
Dependency.prototype.getModuleAllDepMapping = function(moduleName) {
    var that = this;
    var moduleCode = fsExt.readFileSync(this.srcDir, moduleName);
    var deps = parseDependencies(moduleCode);

    var depMapping = {
        global: [],
        local: [],
        tpl: []
    };

    // 保存moduleName, 对后面解析子模块使用.
    depMapping.moduleName = moduleName;

    deps.forEach(function(depModuleName) {
        if (depModuleName.indexOf('.tpl') > 0) {
            // 模板开始内嵌
            depMapping.tpl.push(depModuleName);
        } else if (depModuleName.indexOf('.') === 0) {

            // 内部模块依赖
            depMapping.local.push(depModuleName);
        } else {
            var globalModuleDeps = GlobalDepMapping[depModuleName];

            if (!globalModuleDeps) {
                globalModuleDeps = (GlobalDepMapping[depModuleName] =
                        that.findGlobalModuleDeps(depModuleName));
            }
            splice.apply(depMapping.global,
                    [depMapping.global.length, 0].concat(globalModuleDeps));
        }
    });

    depMapping.global = unique(depMapping.global);
    depMapping.local = unique(depMapping.local);
    return depMapping;
};

var GlobalDepMapping = {};

var depPattern = /^\s*define\s*\(\s*[^,]+\s*,\s*\[((['"]?)[^\]]*)\2?\]\s*,\s*function/;

/** 根据指定全局模块，获取此模块的依赖列表。
 * define("#widget/0.9.13/widget-debug",
 *    ["base","$","./daparser","./auto-render"],
 *    function(require, exports, module) {
 *
 * @param {String} moduleName 模块名称.
 * @return {Array} 返回指定的全局模块的依赖关系列表.
 */
Dependency.prototype.findGlobalModuleDeps = function(moduleName) {
    var globalId = this.project.alias[moduleName];
    globalId = globalId.indexOf('#') === 0 ? globalId.slice(1,
            globalId.length) : globalId;

    //TODO 目前依赖dist目录，后续会依赖服务器资源。
    var globalModuleDistPath = path.join(this.project.srcDirectory,
            '../../../dist', globalId + '.' + this.project.type);
    var moduleCode = fsExt.readFileSync(globalModuleDistPath, '');

    var depStr = moduleCode.match(depPattern)[1].replace(/['"]/g, '');
    var deps = [];
    if (depStr.length !== 0) {
        deps = depStr.split(',');
    }
    deps.unshift('#' + globalId);
    return deps;
};

var moduleNamePattern = /(?:^|[^.])\brequire\s*\(\s*(["'])([^"'\s\)]+)\1\s*\)/g;

function parseDependencies(code) {
    var ret = [], match;
    code = removeComments(code);

    while ((match = moduleNamePattern.exec(code))) {
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

module.exports = Dependency;
