var fs = require('fs');
var util = require('util');
var path = require('path');
var wrench = require('wrench');

var ActionFactory = require('./action_factory.js');
var Util = require('../utils/string.js')

Init = ActionFactory.create('Init');

Init.prototype.run = function(callback) {
    var projectDir = process.cwd();
    var dir = path.dirname(module.filename);

    // 获取项目名
    var projectName = this.args[0];
    if (!projectName) {
        projectName = projectDir.split('/').pop();
    }
    console.log('>>> PROJECT NAME: ' + projectName);

    // 复制模版
    wrench.copyDirSyncRecursive(
        path.join(dir, 'init/_template'),
        projectDir,
        {preserve: true}
    );
    console.log('>>> COPY TEMPLATE TO ' + projectDir);


    // 替换项目名
    var model = {project: projectName};
    wrench.readdirRecursive(projectDir, function(err, files) {
        files && files.forEach(function(o, i) {
            var file = path.join(projectDir, o);
            var stat = fs.statSync(file);
            if (stat.isFile()) {
                replaceTpl(file, model);
            }
        });
    });
};

module.exports = Init;

var TEMPLATEREG = /{{([a-zA-Z0-9-]+)}}/g;
function replaceTpl(file, model) {
    var newFile,
        fileName = path.basename(file),
        dirName = path.dirname(file);

    // 替换文件名
    if (TEMPLATEREG.test(fileName)) {
        var newFileName = fileName.replace(TEMPLATEREG, replaceFun);
        newFile = path.join(dirName, newFileName);
    } else {
        newFile = file;
    }

    // 替换文件内容
    var data = fs.readFileSync(file, 'utf-8');
    data = data.replace(TEMPLATEREG, replaceFun);
    fs.writeFileSync(newFile, data, 'utf-8');

    console.log('>>> MOVE ' + file + ' -> ' + newFile);

    function replaceFun(match, tplName) {
        var realName = model[tplName.toLowerCase()];
        return /^[A-Z]/.test(tplName) ?
            Util.capitalize(realName) :
            realName;
    }

}
