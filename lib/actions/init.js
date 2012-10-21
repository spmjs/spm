var fs = require('fs');
var util = require('util');
var path = require('path');
var shelljs = require('shelljs');
var optimist = require('optimist');
var prompt = require('prompt');

var ActionFactory = require('../core/action_factory.js');
var Util = require('../utils/string.js')
var fsExt = require('../utils/fs_ext.js');

Init = ActionFactory.create('Init');

Init.prototype.registerArgs = function() {
  var opts = this.opts;
  opts.help('create a empty module.');
  opts.add('r', 'root', 'default root value');
  opts.add('base', 'set project directory.');

  opts.defaultValue('root', '#');
};

Init.prototype.execute = function(options, callback) {
  var projectDir = options.base || process.cwd();
  var dir = path.dirname(module.filename);
  
  // support -r --root
  var root = options.root === true ? '#' : options.root;

  // 获取项目名
  var projectName = options['name'] || options._[3];
  if (!projectName) {
    projectName = projectDir.split(path.sep).pop();
  }
  console.info('>>> PROJECT NAME: ' + projectName);

  prompt.start();

  var schema = {
    properties: {
      type: {
        pattern: /^[1-3]$/,
        message: 'Name must be Number.',
        required: true,
        description: 'Please select module type:\n1: sample module \n' + 
            '2: widget module \n3: system module \nChoose a number'
      }
    }
  };

  prompt.get(schema, function(err, result) {
    var moduleType = result.type;
    var baseDir = path.join(dir, 'init', '_template_' + moduleType);
    if (!fsExt.existsSync(path.join(baseDir, moduleType))) {
      moduleType = 1; 
    }
    baseDir = path.join(baseDir, moduleType);
    var files = shelljs.ls('-R', baseDir);

    // 替换模版
    var model = {
      project: projectName,
      root: root
    };

    files.forEach(function(o) {
      var src = path.join(baseDir, o);
      var dist = path.join(projectDir, o);
      if (fsExt.isFile(src)) {
          replaceTpl(src, dist, model);
      }
    });
    callback();
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
  } else if (fileName == 'gitignore') {
    newFile = path.join(dirName, '.' + fileName);
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
