
// spm 核心模块

var fs = require('fs');
var util = require('util');
var path = require('path');

var CONFIG = require('./config.js');

// 工具类加载
require('./utils/colors.js');
var StringUtil = require('./utils/string.js');

// 项目配置文件解析，产生出项目模型
var ProjectFactory = require('./core/project_factory.js');

var spm = {};
module.exports = spm;


// run from commandline
if (require.main) {
    spm.cli = require.main.exports.cli || (require.main === module);
}

if (spm.cli) {
    var args = process.argv;
    var action = args[2];

    // spm --version
    if (action === '-v' || action === '--version') {
        console.log('v' + CONFIG.VERSION);
        process.exit();
    }

    if (!action || ('build,dist').inexOf(action) < 0) {
        outoutHelp();
        return;
    }

    // 根据当前执行目录，查找配置文件，构建项目信息。
    var projectModel = ProjectFactory.getProjectModel(action, process.cwd());
    var result = execute(projectModel);

    if (result === 0) {
        console.log(action + ' success!');
    } else {
        console.error(action + ' error!');
    }
}

function outoutHelp() {
    console.log('Usage: spm <command>\n');
    console.log('Where <command> is one of:');
    console.log('    build, dist\n');
    console.log('spm build    build project.');
    console.log('spm dist     install project to dist dir.');
}

// 执行项目插件。
// TODO 后续支持外部插件加载.
function execute(projectModel) {
    var plugins = projectModel.plugins;
    var len = plugins.length;
    var result = 0;
    var i, plugin;

    for (i = 0; i < len; i++) {
        try {
            plugin = require('./plugins/' + plugins[i] + '.js');
            console.log(plugins[i]);
            plugin.execute.apply(null,
                    [projectModel].concat(plugin.args || []));
        } catch (e) {
            console.error(e);
            result = 1;
            // TODO 有些异常可以只是进行错误提示，但是不影响整体打包流程。
            break;
        }
    }
    return result;
}

// TODO 自定义异常。
// TODO plugin加载，后续会根据生命周期默认插件，和用户自定义来产生出具体的插件执行列表

