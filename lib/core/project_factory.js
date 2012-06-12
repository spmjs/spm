
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

/**
 * 产生整体项目模型对象，包括项目基本信息，build(plugin)信息。
 * @param {String} action 用户执行的操作.
 * @param {Object} projectDir 项目目录.
 * @return {Object} 项目对象.
 */
exports.getProjectModel = function(action, projectDir) {

    var projectModel = getProjectInfo(projectDir);
    var spmConfig = getSpmConfig(projectDir);
    var globalAlias = getGlobalAlias(projectDir);

    projectModel.id = getProjectId(projectDir);
    projectModel.dist = spmConfig.dist || {};
    projectModel.alias = spmConfig.alias || {};
    projectModel.alias.__proto__ = globalAlias;

    projectModel.type = projectModel.type || 'js';
    projectModel.srcDirectory = path.join(projectDir, 'src');
    projectModel.buildDirectory = path.join(projectDir, 'build');
    projectModel.distDirectory = path.join(projectModel.buildDirectory, 'dist');
    projectModel.plugins = PluginFactory.getPlugins(action, projectModel);

    // 创建Build目录。
    fsExt.mkdirS(projectModel.buildDirectory);

    // 创建dist目录。
    fsExt.mkdirS(projectModel.distDirectory);

    return projectModel;
};

// parse package.json
function getProjectInfo(projectDir) {
    return eval('(' + fsExt.readFileSync(projectDir, 'package.json') + ')');
}

// 获取当前模块d
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

