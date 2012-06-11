
// 项目分析模块

var path = require('path');
var vm = require('vm');
var fs = require('fs');
var util = require('util');

var PluginFactory = require('./plugin_factory.js');

/**
 * 产生整体项目模型对象，包括项目基本信息，build(plugin)信息。
 * @param {String} action
 * return {Object} 项目对象.
 */
exports.getProjectModel = function(action, projectDir) {

    var configStr;
    try {
        configStr = fs.readFileSync(projectDir + '/__config.js');
    } catch (e) {
        throw '__config.js load failure!';
    }

    function define(__config) {
        return __config;
    }
    var projectModel = eval(configStr + '');

    projectModel.type = projectModel.type || 'js';
    projectModel.srcDirectory = path.join(projectDir, 'src');
    projectModel.buildDirectory = path.join(projectDir, 'build');
    projectModel.distDirectory = path.join(projectModel.buildDirectory, 'dist');
    projectModel.plugins = PluginFactory.getPlugins(action, projectModel);

    // 创建Build目录。
    if (!path.existsSync(projectModel.buildDirectory)) {
        fs.mkdirSync(projectModel.buildDirectory, '0777');
    }

    // 创建dist目录。
    if (!path.existsSync(projectModel.distDirectory)) {
        fs.mkdirSync(projectModel.distDirectory, '0777');
    }

    return projectModel;
};
