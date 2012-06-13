
// 项目分析模块

var path = require('path');
var vm = require('vm');
var fs = require('fs');
var util = require('util');
var astParser = require('uglify-js').parser;

var fsExt = require('../utils/fs_ext.js');
var win_os = require('../utils/win_os.js');
var Ast = require('../utils/ast.js');

var PluginFactory = require('./plugin_factory.js');

var Dependency = require('./dependency.js');

/**
 * 产生整体项目模型对象，包括项目基本信息，build(plugin)信息。
 * @param {String} action 用户执行的操作.
 * @param {Object} projectDir 项目目录.
 * @return {Object} 项目对象.
 */
exports.getProjectModel = function(action, projectDir) {
    return new Project(action, projectDir);
};

//项目基类，里面将封转一些常用的方法.
function Project(action, projectDir) {
    var spmConfig = getSpmConfig(projectDir);
    var globalAlias = getGlobalAlias(projectDir);

    this.id = getProjectId(projectDir);
    this.projectInfo = getProjectInfo(projectDir);
    this.version = this.projectInfo.version;
    this.dist = spmConfig.dist || {};
    this.alias = spmConfig.alias || {};
    this.alias.__proto__ = globalAlias;

    this.type = this.projectInfo.type || 'js';
    this.srcDirectory = path.join(projectDir, 'src');
    this.buildDirectory = path.join(projectDir, 'build');
    this.distDirectory = path.join(this.buildDirectory, 'dist');
    this.plugins = PluginFactory.getPlugins(action, this.type);

    // 创建Build目录。
    fsExt.mkdirS(this.buildDirectory);

    // 创建dist目录。
    fsExt.mkdirS(this.distDirectory);

    this.initModuleList();
    this.initModuleIdMapping();

    var dependency = new Dependency(this);
    this.moduleDepMapping = dependency.getModuleDepMapping();
}

// 根据 dist 配置，找到相关需要处理的模块文件，因为可能存在资源文件
Project.prototype.initModuleList = function() {
    var moduleList = [];
    var dists = this.dist;
    var type = this.type;
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

// 获取项目中模块名(模块全路径)和id的映射关系
// id 映射
// ['switchable.js', 'plugins/effect.js', 'tabs.js', 'plugins/autoplay.js'] =>
// {
//    '{projectDir}/build/switchable.js': '#switchable/0.9.4/switchable',
//    '{projectDir}/build/plugins/effect.js': '#switchable/0.9.4/plugins/effect',
//    '{projectDir}/build/tabs.js': '#switchable/0.9.4/tabs',
//    '{projectDir}/build/plugins/auto.js': '#switchable/0.9.4/plugins/auto'
// }
Project.prototype.initModuleIdMapping = function() {
    var that = this;
    var moduleIdMapping = this.moduleIdMapping = {};

    this.moduleList.forEach(function(moduleName) {
        moduleIdMapping[that.getModulePath(moduleName)] =
                that.getModuleId(moduleName);
    });

};

// 根据模块民成，获取模块id.
Project.prototype.getModuleId = function(moduleName) {
    return '#' + this.id + '/' + this.projectInfo.version +
            '/' + moduleName.split('.')[0];
};

// 获取global module id.
Project.prototype.getGlobalModuleId = function(moduleName) {
    var globalId = this.alias[moduleName];
    return globalId.indexOf('#') === 0 ? globalId : '#' + globalId;
};

// 根据模块name，生成模块路径。
Project.prototype.getModulePath = function(moduleName) {
    return path.join(this.srcDirectory, moduleName);
};

// 根据当前Module和依赖的module解析出依赖的模块Id,
Project.prototype.getDepModuleId = function(activeModule, depModule) {
    var depModulePath = path.join(this.srcDirectory,
            path.dirname(activeModule), depModule) + '.' + this.type;
    return this.moduleIdMapping[depModulePath];
};

// parse package.json
function getProjectInfo(projectDir) {
    return eval('(' + fsExt.readFileSync(projectDir, 'package.json') + ')');
}

// 获取当前项目id
function getProjectId(projectDir) {
    projectDir = win_os.normalizePath(projectDir);
    return projectDir.slice(projectDir.lastIndexOf('/') + 1,
            projectDir.length);
}

// parse spm-config.js
function getSpmConfig(projectDir) {
    function define(__config) {
        return __config;
    }

    var spmConfigStr = fsExt.readFileSync(path.join(projectDir, 'src'),
            'spm-config.js');
    return eval(spmConfigStr);
}

// parse seajs-and-its-friend.js
function getGlobalAlias(projectDir) {
    var globalConfigDir = path.join(projectDir, '../../tools/');
    var globalConfigStr = fsExt.readFileSync(globalConfigDir,
            'seajs-and-its-friends.js');

    var ast = astParser.parse(globalConfigStr);
    var alias = {};

    Ast.walk(ast, 'stat', function(stat) {
        if (stat.toString().indexOf('stat,call,dot,name,seajs,config,') !== 0) {
            return stat;
        }

        var configArgs = stat[1][2][0];
        if (!configArgs || configArgs[0] !== 'object') {
            return stat;
        }

        // find alias config.
        // [ 'stat',
        //   [ 'call', [ 'dot', ['name', 'seajs'], 'config' ],
        //   [ ['object', [Object]] ] ] ]
        var configAst = configArgs[1];
        var aliasAst;
        configAst.some(function(item) {
            if (item[0] === 'alias') {
                aliasAst = item[1][1];
                return true;
            }
        });

        if (!aliasAst) return stat;

        // convert aliasConfig ast to object.
        // aliasConfig:
        // [ [ '$', [ 'string', 'jquery/1.7.2/jquery' ] ],
        //    [ 'jquery', [ 'string', 'jquery/1.7.2/jquery' ] ],
        //    [ 'zepto', [ 'string', 'zepto/1.0.0/zepto' ] ],
        //    [ 'underscore', [ 'string', 'underscore/1.3.3/underscore' ] ]...]
        aliasAst.forEach(function(item) {
            alias[item[0]] = item[1][1];
        });
        return stat;
    });

    return alias;
}

