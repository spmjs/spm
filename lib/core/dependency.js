// 依赖分析
// TODO 这个插件看看能否有更好的名字？
// 在这个模块里面，会对所有的模块进行依赖分析，命名替换等操作。

// TODO 是根据dist的配置收集相关处理模块呢？
// 还是遍历所有文件，根据文件的内容来进行模块判定。

var util = require('util');
var path = require('path');

var fsExt = require('../utils/fs_ext.js');

/**
 * 依赖分析，并输出完整的模块(包括，id, deps).
 * @param {Object} project 项目信息.
 */
exports.execute = function(project) {
    var module = new Module(project);
    module.parseModuleList();
};

// 抽象出一个Module,用户处理相关module替换等操作。
function Module(project) {
    this.project = project;

    this.id = project.id;
    this.version = project.version;
    this.type = project.type;
    this.alias = project.alias;
    this.buildDir = project.buildDirectory;
    this.distDir = project.distDirectory;
}

// 解析项目所有模块，并对id, dep, require进行替换。 
Module.prototype.parseModuleList = function() {
    var that = this;
    
    this.initModuleList();
    this.initModuleIdAndDepMapping();

    this.moduleList.forEach(function(moduleName) {
        var moduleCode = that.parseModule(moduleName);
        that.writeModule(moduleName, moduleCode);
    });
};


// 根据 dist 配置，找到相关需要处理的模块文件，因为可能存在资源文件
Module.prototype.initModuleList = function() {
    var moduleList = [];
    var dists = this.project.dist;
    var type = this.project.type;
    var distName, distValue;

    for (distName in dists) {

        if (dists.hasOwnProperty(distName)) {
            distValue = dists[distName];

            if (distValue === 'default') {
                !(~moduleList.indexOf(distName)) && moduleList.push(distName);
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
    this.moduleList = moduleList;
};

// 初始化具体的模块文件和最终的模块ID的对应关系.
// id 映射 
// ['switchable.js', 'plugins/effect.js', 'tabs.js', 'plugins/autoplay.js'] =>
// {
//    '{projectDir}/build/switchable.js': 'switchable/0.9.4/switchable',
//    '{projectDir}/build/plugins/effect.js': 'switchable/0.9.4/plugins/effect',
//    '{projectDir}/build/tabs.js': 'switchable/0.9.4/tabs',
//    '{projectDir}/build/plugins/auto.js': 'switchable/0.9.4/plugins/auto'
// }
// 依赖映射
// {
//    'switchable.js': ['#jquery/1.7.2/jquery', '#widget/0.9.4/widget', './plugin/auto.js']
// }
Module.prototype.initModuleIdAndDepMapping = function() {
    var that = this;
    var buildDir = this.buildDir;
    var moduleIdMapping = this.moduleIdMapping ={};
    var moduleDepMapping = this.moduleDepMapping = {};

    var moduleAllDepMapping = {};


    this.moduleList.forEach(function(moduleName) {
        moduleIdMapping[that.getModulePath(moduleName)] =
                that.getModuleId(moduleName);
        moduleAllDepMapping[that.getModuleId(moduleName)] = that.getModuleDepList(moduleName);
    });

    console.log(moduleAllDepMapping)
    // 当所有的模块分析完成后，在重新处理依赖中的相对模块的依赖替换
    this.moduleList.forEach(function(moduleName) {
        var depMapping = moduleAllDepMapping[that.getModuleId(moduleName)];
        var depList = [];
        
        // 遍历所有依赖的局部模块，并把局部模块中的全局依赖，加入模块依赖列表中
        // 然后也把自己加到依赖列表中.
        depMapping.local.forEach(function(localModule) {
            var depModuleId = that.getDepModuleId(moduleName, localModule);
            depList.push(depModuleId);
            [].splice.apply(depList, [depList.length, 0].concat(moduleAllDepMapping[depModuleId].global));
        });
        [].splice.apply(depList, [depList.length, 0].concat(depMapping.global));
        console.log(moduleName, depList, depMapping.global)

        moduleDepMapping[moduleName] = depList;
    });
    
};

// 根据模块name，生成模块路径。
Module.prototype.getModulePath = function(moduleName) {
    return path.join(this.buildDir, moduleName)
};

// 根据模块民成，获取模块id.
Module.prototype.getModuleId = function(moduleName) {
    var project = this.project;
    return '#' + project.id + '/' + project.version + '/' + moduleName.split('.')[0]; 
};

// 分析模块的依赖关系.对于全局依赖，会解析出全路径，对于内部依赖，暂时不解析.
Module.prototype.getModuleDepList = function(moduleName) {
    var that = this;
    var depList = [];
    var moduleCode = fsExt.readFileSync(this.buildDir, moduleName);
    var deps = parseDependencies(moduleCode);
console.log(moduleName, deps)
    var depMapping = {
        global: [],
        local: []
    };
    deps.forEach(function(depModuleName) {
        if (depModuleName.indexOf('.') === 0) {
            //内部模块依赖
            depMapping.local.push(depModuleName);
        } else {
            var globalModuleDeps = GlobalDepMapping[depModuleName];
            if (!globalModuleDeps) {
                globalModuleDeps = (GlobalDepMapping[depModuleName] =
                        that.findGlobalModuleDeps(depModuleName));
            }
            depList.push(that.getGlobalModuleId(depModuleName));
            [].splice.apply(depMapping.global, [depMapping.global.length, 0].concat(globalModuleDeps));
        }
    });
    depMapping.global = unique(depMapping.global);
    depMapping.local = unique(depMapping.local);
    return depMapping; 
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

// 对模块进行依赖分析和替换
Module.prototype.parseModule = function(moduleName) {
    var that = this;
    var moduleCode = fsExt.readFileSync(this.buildDir, moduleName);
    var depList = this.moduleDepMapping[moduleName]; 

    // 对代码文件中依赖的模块，进行替换. 替换为全路径.
    moduleCode = moduleCode.replace(moduleNamePattern,
            function(match, mark, depModuleName) {
                var moduleId;
                var globalModuleDeps;

                if (depModuleName.indexOf('.') === 0) {
                    //内部模块依赖
                    moduleId = that.getDepModuleId(moduleName, depModuleName);
                } else {
                    moduleId = that.getGlobalModuleId(depModuleName); 
                }
                return ' require("' + moduleId + '")';
            });


    depList = depList.length ? '"' + depList.join('","') + '"' : '';


    return moduleCode.replace('define(function',
            'define("' + this.getModuleId(moduleName) + '", [' + depList + '], function');
};


// 根据当前Module和依赖的module解析出依赖的模块Id,
Module.prototype.getDepModuleId = function(activeModule, depModule) {
    var depModulePath = path.join(this.buildDir,
            path.dirname(activeModule), depModule) + '.' + this.type;

    return this.moduleIdMapping[depModulePath];
};

Module.prototype.getGlobalModuleId = function(depModule) {
    var globalId = this.alias[depModule];
    return globalId.indexOf('#') === 0 ? globalId : '#' + globalId;
};

var GlobalDepMapping = {};

var depPattern = /^\s*define\s*\(\s*[^,]+\s*,\s*\[((['"]?)[^\]]*)\2?\]\s*,\s*function/;

// 根据指定全局模块，获取此模块的依赖列表。
// define("#widget/0.9.13/widget-debug", ["base","$","./daparser","./auto-render"], 
//        function(require, exports, module) {
Module.prototype.findGlobalModuleDeps = function(moduleName) {
    var globalId = this.alias[moduleName];
    globalId = globalId.indexOf('#') === 0 ? globalId.slice(1, globalId.length) : globalId;
    
    //TODO 目前依赖dist目录，后续会依赖服务器资源。
    var globalModuleDistPath = path.join(this.project.srcDirectory, '../../../dist', globalId + '.' + this.type);
    var moduleCode = fsExt.readFileSync(globalModuleDistPath, '');

    var depStr =  moduleCode.match(depPattern)[1].replace(/['"]/g, '');
    var deps = [];
    if (depStr.length !== 0) {
        deps = depStr.split(',');
    }
    deps.unshift('#' + globalId);
    return deps;
};

// 输出module到dist目录。
Module.prototype.writeModule = function(moduleName, moduleCode) {
    var fileName = path.join(this.distDir, moduleName);
    fsExt.writeFileSync(fileName, moduleCode);
};

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

function removeComments(code) {
    return code
            .replace(/(?:^|\n|\r)\s*\/\*[\s\S]*?\*\/\s*(?:\r|\n|$)/g, '\n')
            .replace(/(?:^|\n|\r)\s*\/\/.*(?:\r|\n|$)/g, '\n');
}


