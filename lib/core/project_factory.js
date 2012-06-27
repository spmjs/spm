
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

var SPM_CONFIG = 'spm-config.js';


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

    this.projectDir = projectDir;

    // 获取整体项目类型, arale or alipay.
    this.baseDir = path.join(projectDir, '../..');

    // 获取总项目目录.
    var baseDir = path.join(projectDir, '../../');

    var parentConfig = this.parseParentConfig();
    this.parentConfig = parentConfig;
    this.parentType = parentConfig.parentType;

    this.initAraleDir(baseDir);

    this.projectInfo = this.getProjectInfo();
    this.id = this.getProjectId();
    this.version = this.projectInfo.version;

    this.type = this.projectInfo.type || 'js';
    this.srcDirectory = path.join(projectDir, 'src');
    this.buildDirectory = path.join(projectDir, 'build');
    this.distDirectory = path.join(this.buildDirectory, 'dist');
    this.plugins = PluginFactory.getPlugins(action, this.type);

    // 创建Build目录。
    fsExt.mkdirS(this.buildDirectory);

    // 创建dist目录。
    fsExt.mkdirS(this.distDirectory);

    var spmConfig = getSpmConfig(this.srcDirectory);

    if (spmConfig.compress === 'closure') {
        this.compress = require('../compress/closure.js');
    }

    this.dist = spmConfig.dist || {};
    this.alias = spmConfig.alias || {};

    var globalAlias = this.getGlobalAlias();
    this.alias.__proto__ = globalAlias;
    this.aliasMobile = spmConfig['alias-mobile'];
    this.aliasMobile && (this.aliasMobile.__proto__ = this.alias);

    this.initModuleList();
    this.initModuleIdMapping();
    var dependency = new Dependency(this);
    this.moduleDepMapping = dependency.getModuleDepMapping();
}

Project.prototype = {

    // 根据 dist 配置，找到相关需要处理的模块文件，因为可能存在资源文件
    initModuleList: function() {
        var that = this;
        var moduleList = [];
        var dists = this.dist;
        var type = this.type;
        var distName, distValue;

        for (distName in dists) {

            if (dists.hasOwnProperty(distName)) {
                if (/\.css$|\.tpl$/.test(distName)) {
                    continue;
                }

                if (/^[_\w-]+$/.test(distName)) {
                    // 资源目录
                    continue;
                }

                distValue = dists[distName];

                if (distValue === 'default') {
                    this._addModule(distName);
                    continue;
                }

                if (util.isArray(distValue)) {

                    distValue.forEach(function(moduleName) {
                        that._addModule(moduleName);
                    });
                }
            }
        }
    },

    _addModule: function(moduleName) {
        var moduleList = this.moduleList || (this.moduleList = []);
        !(~moduleList.indexOf(moduleName)) && moduleList.push(moduleName);
    },

    // 获取项目中模块名(模块全路径)和id的映射关系
    // id 映射
    // ['sw.js', 'plugins/effect.js', 'tabs.js',
    //      'plugins/autoplay.js'] =>
    // {
    //    '{projectDir}/build/switchable.js': '#sw/0.9.4/switchable',
    //    '{projectDir}/build/plugins/effect.js': '#sw/0.9.4/plugins/effect',
    //    '{projectDir}/build/tabs.js': '#sw/0.9.4/tabs',
    //    '{projectDir}/build/plugins/auto.js': '#sw/0.9.4/plugins/auto'
    // }
    initModuleIdMapping: function() {
        var that = this;
        var moduleIdMapping = this.moduleIdMapping = {};

        this.moduleList.forEach(function(moduleName) {
            moduleIdMapping[that.getModulePath(moduleName)] =
                    that.getModuleId(moduleName);
        });
    },

    // 初始化arale项目信息. 因为所有的项目都会基于arale进行。
    // TODO 有没有只使用spm 而不适用arale的情况？
    initAraleDir: function(baseDir) {
        if (this.parentType === 'arale') {
            this.araleDir = baseDir;
        } else {
            var localRepo = path.join(process.env.HOME, '.spm');
            if (!path.existsSync(localRepo)) {
                throw 'Not found arale dir config!';
            }
            var localRepoConfig = getSpmConfig(localRepo);
            this.araleDir = localRepoConfig.deps['arale'].localDir;
        }
    },

    // 根据模块民成，获取模块id.
    getModuleId: function(moduleName) {
        var modId = '#';
        if (this.parentType == 'alipay') {
            modId = this.parentType + '/';
        } else if (this.parentType !== 'arale' || this.parentType !== 'handy') {
            modId = '~/' + this.parentType + '/';
        }
        return modId + this.id + '/' + this.projectInfo.version +
                '/' + moduleName.split('.')[0];
    },

    // 获取global module id.
    getGlobalModuleId: function(moduleName) {
        var globalId = this.alias[moduleName];
        if (globalId.indexOf('~') === 0 || globalId.indexOf('#') === 0) {
            return globalId;
        } else if (globalId.indexOf('alipay') > -1) {
            return globalId;
        } else {
            return '#' + globalId;
        }
    },

    // 获取无线模块id.
    getMobileModuleId: function(moduleName) {
        var mobileModId = this.aliasMobile[moduleName];
        return mobileModId.indexOf('#') === 0 ? mobileModId : '#' + mobileModId;
    },

    // 根据模块name，生成模块路径。
    getModulePath: function(moduleName) {
        return path.join(this.srcDirectory, moduleName);
    },

    // 根据当前Module和依赖的module解析出依赖的模块Id,
    getDepModuleId: function(activeModule, depModule) {
        var depModulePath = path.join(this.srcDirectory,
                path.dirname(activeModule), depModule) + '.' + this.type;
        return this.moduleIdMapping[depModulePath];
    },

    // 获取css module id.
    getCssDepModuleId: function(activeModule, depModule) {
        var modId = '#';
        if (this.parentType == 'alipay') {
            modId = this.parentType + '/';
        } else if (this.parentType !== 'arale' && this.parentType !== 'handy') {
            modId = '~/' + this.parentType + '/';
        }
        return modId + this.id + '/' + this.projectInfo.version +
                '/' + path.join(path.dirname(activeModule), depModule);
    },

    // 从build目录获取模块代码，因为我们后续操作的代码都应该是build目录中的.
    getModuleCode: function(moduleName) {
        return fsExt.readFileSync(this.buildDirectory, moduleName);
    },

    // 从源文件目录中获取模块代码.
    getSrcModuleCode: function(moduleName) {
        return fsExt.readFileSync(this.srcDirectory, moduleName);
    },

    // 获取模块的依赖关系
    getModuleDepMapping: function(moduleId) {
        return this.moduleDepMapping[moduleId];
    },

    // parse package.json
    getProjectInfo: function() {
        var dir = this.projectDir;
        return eval('(' + fsExt.readFileSync(dir, 'package.json') + ')');
    },

    // 获取当前项目id
    getProjectId: function() {
        var projectDir = win_os.normalizePath(this.projectDir);
        return projectDir.slice(projectDir.lastIndexOf('/') + 1,
                projectDir.length);
    },

    // 获取当前项目整体信息.
    parseParentConfig: function() {
        var baseDir = this.baseDir;
        // HACK 由于在自己的项目中没有配置父类信息，所以只能通过路径来parse.
        var parentConfigStr = fsExt.readFileSync(baseDir,
                'package.json');
        var parentConfig = JSON.parse(parentConfigStr);

        // HACK 根据整体项目目录来决定项目类型, arale, alipay, cashier
        parentConfig.parentType = path.basename(baseDir).replace(/\//g, '');
        return parentConfig;
    },

    // parse spm-config.js
    getSpmConfig: function() {
        return getSpmConfig(path.join(this.projectDir, 'src'));
    },

    getGlobalAlias: function() {
        var baseAlias = getSpmConfig(this.baseDir).alias;
        if (this.parentType !== 'arale' && this.parentType !== 'handy') {
            baseAlias.__proto__ = getSpmConfig(this.araleDir).alias;
        }
        return baseAlias;
    }
};

function parseAlias(spmConfigStr) {
    var ast = astParser.parse(spmConfigStr);
    var alias = {};
    // parse alias
    Ast.walk(ast, 'stat', function(stat) {
        if (aliasFilter.is(stat)) {
            aliasFilter.parse(stat, alias);
        }
        return stat;
    });
    return alias;
}

var aliasFilter = {
    is: function(stat) {
        var indexStr = 'stat,call,dot,name,seajs,config,';
        return stat.toString().indexOf(indexStr) === 0;
    },
    parse: function(stat, alias) {
        var configArgs = stat[1][2][0];

        if (!configArgs || configArgs[0] !== 'object') {
            return stat;
        }
        // find alias config.
        // [ 'stat',
        //   [ 'call', [ 'dot', ['name', 'seajs'], 'config' ],
        //   [ ['object', [Object]] ] ] ]
        var configAst = configArgs[1];

        // TODO 是否有更灵活的方式加载更多的配置
        var aliasAst = [];
        configAst.forEach(function(item) {
            if (item[0] === 'alias') {
                aliasAst = item[1][1];
                return true;
            }
        });

        if (!aliasAst.length) return stat;

        // convert aliasConfig ast to object.
        // aliasConfig:
        // [ [ '$', [ 'string', 'jquery/1.7.2/jquery' ] ],
        //    [ 'jquery', [ 'string', 'jquery/1.7.2/jquery' ] ],
        //    [ 'zepto', [ 'string', 'zepto/1.0.0/zepto' ] ],
        //    [ 'underscore', [ 'string', 'underscore/1.3.3/underscore' ] ]...]
        aliasAst.forEach(function(item) {
            alias[item[0]] = item[1][1];
        });
        return alias;
    }
};

function getSpmConfig(configDir) {
    console.log('load ' + path.join(configDir, SPM_CONFIG));
    var define = function(__config) {
            return __config;
    };
    var seajs = {
        config: function(__config) {
            return __config;
        }
    };
    var spmConfigStr = fsExt.readFileSync(configDir, SPM_CONFIG);
    return eval(spmConfigStr);
}


