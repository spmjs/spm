var fs = require('fs');
var util = require('util');
var path = require('path');
var optimist = require('optimist');
var async = require('async');
var prompt = require('prompt');

var ActionFactory = require('../core/action_factory.js');
var ProjectFactory = require('../core/project_factory.js');
var moduleHelp = require('../utils/module_help.js');
var Util = require('../utils/string.js')
var fsExt = require('../utils/fs_ext.js');
var Search = require('../actions/search.js');

Init = ActionFactory.create('Init');
module.exports = Init;

Init.prototype.registerArgs = function() {
  var opts = this.opts;
  opts.help('create a empty module.');
  opts.add('r', 'root', 'default root value');
  opts.add('base', 'set project directory.');
  opts.add('module-type', 'select module template.');

  opts.defaultValue('root', '');
};

Init.prototype.execute = function(options, callback) {
  var that = this;
  var baseDir = this.baseDir = options.base || process.cwd();

  var model = this.model = {};

  model.root = options.root || '';
  // 获取项目名
  model.name = options.name || null; 

  var searchStr = 'type=template';
  if (options.extras.length) {
    searchStr += ',' + options.extras[0]; 
  } 
  console.log('searchStr--->', searchStr);

  // TODO 1. list all template name
  // TODO 2. Specified template name
  Search.search(searchStr, function(mods) {
    // 无法获取源模板，输出默认模板.
    if (mods.length === 0) {
      that.outputTemplate(); 
      callback();
    } else {
      var schema = {
        properties: {
          type: {
            pattern: /^\d+$/,
            message: 'Name must be Number.',
            required: true
          }
        }
      };

      var deps = ['Please select module type:\n'];
      mods.forEach(function(mod, index) {
        deps.push((index + 1) + ': -> ' + mod.name + '(' + mod.description + ')');
      });

      schema.properties.type.description = deps.join('');

      getPrompt(schema, function(result) {
        that.outputServerTemplate(mods[result.type - 1], callback); 
      });
    }
  });
};

Init.prototype.outputServerTemplate = function(templateMods, cb) {
  var model = this.model;
  var baseDir = this.baseDir;

  ProjectFactory.getProjectModel('init', this.createOptions({}), function(projectModel) {

    async.waterfall([
      function(cb) {
        // get version
        getTemplateVersion(templateMods, cb);
      }, function(templateMods, cb) {
        // create model
        getTemplateInfo(projectModel, templateMods, model, cb); 
      }], function(templatePath, model) {
        console.log('model---->', model, templatePath);
        replaceTpls(templatePath, baseDir, model);
        cb();
      });
  });
};

function getTemplateVersion(templateMod, cb) {
  var versions = templateMod.versions;
  var vs = Object.keys(versions);

  if (vs.length === 1) {
    templateMod.version = vs[0]; 
    cb(null, templateMod);
    return;
  }

  var schema = {
    properties: {
      type: {
        pattern: /^\d+$/,
        message: 'Name must be Number.',
        required: true
      }
    }
  };

  var vers = ['Choose versions:\n'];

  vs.forEach(function(ver, index) {
    vers.push((index + 1) + ': -> ' + ver + '\n');
  });

  schema.properties.type.description = vers.join('');

  getPrompt(schema, function(result) {
    if (result.type - 1 > vs.length) {
      result.type = vs.length;
    }
    templateMod.version = vs[result.type - 1]
    cb(null, templateMod); 
  });
}

var TEMPLATEREG = /{{([a-zA-Z0-9-]+)}}/g;

// TODO 扫描模板内容，查找需要用户输入的变量.
function getTemplateInfo(projectModel, templateMods, model, cb) {
  var modId = moduleHelp.generateModuleId(templateMods);

  projectModel.getSourceModule(modId, function(err, _modId, filePath) {
    var templatePath = path.join(path.dirname(filePath), 'template');

    fsExt.listFiles(templatePath).forEach(function(f) {
      var code = fsExt.readFileSync(f);
      code.replace(TEMPLATEREG, function(match, key) {
        model[key] = model[key] || null;
      });
    });

    // 查找模板中需要用户补充完成的。
    var modelKeys = Object.keys(model);
    if (modelKeys.length > 0) {
       var schema = {
         properties: {
           type: {
             pattern: /^.+$/,
             message: 'Value cannot be empty!',
             required: true
           }
         }
       };

       async.forEachSeries(modelKeys, function(key, cb) {
          schema.properties.type.description = 'Define value for property \'' + key + '\': ';
          getPrompt(schema, function(result) {
            model[key] = result.type;
            cb();
          });
       }, function() {
         cb(templatePath, model);
       });

    } else {
      cb(null, templatePath, model);
    }
  });
}

Init.prototype.outputTemplate = function() {
  var model = this.model;
  var baseDir = this.baseDir;

  // 获取项目名, 默认是目录名。
  if (!model.name) {
    model.name= baseDir.split(path.sep).pop();
  }

  // 查找系统默认模板。
  var dir = path.dirname(module.filename);
  var templateDir = path.join(dir, 'init', '_template');
  replaceTpls(templateDir, baseDir, model);
};

function replaceTpls(baseDir, targetDir, model) {
  fsExt.list(baseDir).forEach(function(o) {
    var src = path.join(baseDir, o);
    var dist = path.join(targetDir, o);
    if (fsExt.isFile(src)) {
        replaceTpl(src, dist, model);
    }
  });
}

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

  // data = data.replace(TEMPLATEREG, replaceFun);
  data = Util.tmpl(data, model);
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

function getPrompt(schema, cb) {
  prompt.start();
  prompt.get(schema, function(err, result) {
    cb(result);
  });
}
