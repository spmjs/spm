var fs = require('fs');
var util = require('util');
var path = require('path');
var wrench = require('wrench');
var optimist = require('optimist');

var ActionFactory = require('./action_factory.js');
var Util = require('../utils/string.js')
var fsExt = require('../utils/fs_ext.js');

Init = ActionFactory.create('Init');

Init.MESSAGE = {

  USAGE: 'usage: spm init [-r root]',

  DESCRIPTION: 'create a empty module.'
};


Init.prototype.run = function(callback) {
    var projectDir = process.cwd();
    var dir = path.dirname(module.filename);
    var baseDir = path.join(dir, 'init', '_template');

    var argv = require('optimist')
        .alias('r', 'root')
        .default('r', '#')
        .argv;

    // support -r --root
    var root = argv.root === true ? '#' : argv.root;

    // 获取项目名
    var projectName = this.args[0];
    if (!projectName) {
        projectName = projectDir.split(path.sep).pop();
    }
    console.info('>>> PROJECT NAME: ' + projectName);

    // 替换模版
    var model = {
        project: projectName,
        root: root
    };
    wrench.readdirRecursive(baseDir, function(err, files) {
        files && files.forEach(function(o, i) {
            // ignore dotfile
            if (/^\./.test(o)) {
                return;
            }
            var src = path.join(baseDir, o);
            var dist = path.join(projectDir, o);
            if (fsExt.isFile(src)) {
                replaceTpl(src, dist, model);
            }
        });
    });
};

module.exports = Init;

var TEMPLATEREG = /{{([a-zA-Z0-9-]+)}}/g;
function replaceTpl(src, dist, model) {
    var newFile, reomveFile,
        fileName = path.basename(dist),
        dirName = path.dirname(dist);

    // 替换文件名
    if (TEMPLATEREG.test(fileName)) {
        var newFileName = fileName.replace(TEMPLATEREG, replaceFun);
        newFile = path.join(dirName, newFileName);
    } else {
        newFile = dist;
    }

    // 如果文件已存在则不处理
    if (fsExt.existsSync(newFile)) {
        return;
    }

    // 替换文件内容
    var data = fsExt.readFileSync(src);
    data = data.replace(TEMPLATEREG, replaceFun);
    fsExt.writeFileSync(newFile, data);

    console.info('>>> GENERATE ' + newFile);

    // var model = {project: 'widget'};
    // {{Project}} -> Widget
    // {{project}} -> widget
    function replaceFun(match, tplName) {
        var realName = model[tplName.toLowerCase()];
        return /^[A-Z]/.test(tplName) ?
            Util.capitalize(realName) :
            realName;
    }

}
