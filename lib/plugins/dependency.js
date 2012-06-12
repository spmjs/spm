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
    this.alias = project.alias;
    this.buildDir = project.buildDirectory;
    this.distDir = project.distDirectory;
    this.initModuleList();
    this.initModuleMapping();
}

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

// 返回把模块列表转变为模块和全局模块id的对应关系列表。
// ['switchable.js', 'plugins/effect.js', 'tabs.js', 'plugins/autoplay.js'] =>
// {
//    'lib/switchable/build/switchable.js': 'switchable/0.9.4/switchable',
//    'lib/switchable/src/plugins/effect.js': 'switchable/0.9.4/plugins/effect',
//    'lib/switchable/src/tabs.js': 'switchable/0.9.4/tabs',
//    'lib/switchable/src/plugins/auto.js': 'switchable/0.9.4/plugins/auto'
// }
Module.prototype.initModuleMapping = function() {
    var mapping = {};
    var project = this.project;
    var buildDir = this.buildDir;
    this.moduleList.forEach(function(moduleName) {
        mapping[path.join(buildDir, moduleName)] = '#' + project.id +
                '/' + project.version + '/' + moduleName.split('.')[0];
    });
    this.moduleMapping = mapping;
};

var moduleNamePattern = /(?:^|[^.])\brequire\s*\(\s*(["'])([^"'\s\)]+)\1\s*\)/g;

// 对模块进行依赖分析和替换
Module.prototype.parseModule = function(moduleName) {
    var that = this;
    var moduleCode = fsExt.readFileSync(this.buildDir, moduleName);
    return moduleCode.replace(moduleNamePattern,
            function(match, mark, depModuleName) {
                console.log(match);
                if (depModuleName.indexOf('\.') === 0) {
                    //内部模块依赖
                   that.getDepModuleId(moduleName, depModuleName);
                }
                return match;
            });
};

Module.prototype.parseModuleList = function() {
    var that = this;
    this.moduleList.forEach(function(moduleName) {
        var moduleCode = that.parseModule(moduleName);
        that.writeModule(moduleName, moduleCode);
    });
};

// 根据当前Module和依赖的module解析出依赖的模块Id,
Module.prototype.getDepModuleId = function(currentModule, depModule) {
    var depModulePath = path.join(this.buildDir,
            path.dirname(currentModule), depModule);

    return depModulePath;
};

// 输出module到dist目录。
Module.prototype.writeModule = function(moduleName, moduleCode) {
    var fileName = path.join(this.distDir, moduleName);
    fsExt.writeFileSync(fileName, moduleCode);
};



// 根据指定模块，返回全局依赖, 并对全局模块进行替换.
function parseAndReplaceModel(moduleCode, fn) {
    moduleCode.replace(moduleNamePattern, function(match, mark, moduleName) {
        console.log('1---------', moduleName);
    });
}



// 根据相对模块，获取全局模块id.
function getModuleNameByRelaPath(relaModuleName) {


}

var GlobalDepMapping = {

};

// 根据指定全局模块，获取此模块的依赖列表。
function findGlobalModelDeps(moduleName) {

}

function parseDependencies(code) {
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


// 根据指定模块
