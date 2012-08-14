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

    // 复制模版
    wrench.copyDirSyncRecursive(
        path.join(dir, 'init', '_template'),
        projectDir,
        {preserve: true}
    );
    console.info('>>> COPY TEMPLATE TO ' + projectDir);

    // 替换模版
    var model = {
        project: projectName,
        root: root
    };
    wrench.readdirRecursive(projectDir, function(err, files) {
        files && files.forEach(function(o, i) {
            // ignore dotfile
            if (/^\./.test(o)) {
                return;
            }
            var file = path.join(projectDir, o);
            if (fsExt.isFile(file)) {
                replaceTpl(file, model);
            }
        });
    });
};

module.exports = Init;

var TEMPLATEREG = /{{([a-zA-Z0-9-]+)}}/g;
function replaceTpl(file, model) {
    var newFile, reomveFile,
        fileName = path.basename(file),
        dirName = path.dirname(file);

    // 替换文件名
    if (TEMPLATEREG.test(fileName)) {
        var newFileName = fileName.replace(TEMPLATEREG, replaceFun);
        newFile = path.join(dirName, newFileName);
        reomveFile = file;
    } else {
        newFile = file;
    }

    // 替换文件内容
    var data = fsExt.readFileSync(file);
    data = data.replace(TEMPLATEREG, replaceFun);
    fsExt.writeFileSync(newFile, data);

    console.info('>>> MOVE ' + file + ' -> ' + newFile);

    if (reomveFile) {
        fs.unlink(reomveFile, function(err) {
            if (err) throw err;
        });
    }

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
