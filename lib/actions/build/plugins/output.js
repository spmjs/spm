
// 项目文件合并
// 其中合并后的文件会存放到 build/dist 目录中。
// 在合并后的文件中，会对依赖进行分析处理替换。
// 为了便于方便，在这个里面也会处理文件压缩。

var path = require('path');
var fs = require('fs');
var util = require('util');
var async = require('async');

var fsExt = require('../utils/fs_ext.js');
var cssCompress = require('../compress/css_compress.js');


/**
 * 项目文件合并
 * @param {Object} project 项目模型信息.
 */
module.exports = function(project, callback) {
    callback();
  var output = project.output;

  // 如果没有配置output, 默认把build目录copy到dist目录.
  if (!output) {
    fsExt.copydirSync(project.buildDirectory, project.distDirectory);
    callback();
  }
}

/**
 * 预先收集合并模块依赖，主要是针对js模块. 比如在outout配置中发现
 *  "switchable.js": ["switchable.js", "plugins/autoplay.js", "plugins/effects.js"]
 * 我们会生成 
 *  {switchable.js': ["plugins/autoplay.js", "plugins/effects.js"]}
 * 然后我们在后续打包的模块中，发现有依赖switchable模块的，会从此模块中的依赖
 * 去除包含 switchable.js合并的几个模块.
 */
function collectMergeModules(project) {
  var output = project.output;
  var includes;
  var mergeModules = {};
  for (var moduleName in output) {
    if (dist.hasOwnProperty(moduleName)) {
      includes = output[moduleName].slice(0);
      if (util.isArray(includes)) {
        // 输出合并文件
        includes.splice(includes.indexOf(moduleName),1);
        var includeIds = [];
        includes.forEach(function(include) {
          includeIds.push(project.getModuleId(include));
        });
        mergeModules[project.getModuleId(moduleName)] = includeIds;
        mergeModules[project.getModuleId(moduleName) + '-debug'] = includeIds.map(function(include) {
          return include + '-debug';
        });
      }
    }
  }
  return mergeModules;
}

// 目前下面几个需求
// 1. 规则的执行需要同步，因为牵扯到合并，可能需要从服务器获取模块
// 2. 可以很方便的添加新规则。
// 3. 规则可以动态的从文件中获取.
// 4. 规则需要提供一个方法来检查includes，来确定是否有次规则来执行.
// 5. 系统会给规则提供project, includes, outputFilename, callback信息.
// 6. Rule可以是一个函数.
//

// 默认合并规则基类.

var RuleHandler = function() {
  this._handlers = [];
};

RuleHandler.prototype.add = function(handler) {
  this._handlers.push(handler);
};

RuleHandler.prototype.handler = function(project, output, callback) {
  this._handlers.some(function(handler) {
    if (handler.check(output)) {
      handler.output.apply(handler, [].slice.call(arguments));
      return true;
    } else {
      return false;
    }
  });
};

var CssRule = {
  check: function(project, output) {
    return /.css$/.test(output.filename);
  },
  output: function(project, output, callback) {
    var filename = outout.filename;
    var resDirPath = path.join(project.distDirectory, filename);
    cssCompress(path.join(project.buildDirectory, filename), function(code) {
      fsExt.writeFileSync(resDirPath, code);
      callback();
    });
  }
};

var ResourceRule = {
  check: function(output) {
    return /^[_\w-]+$/.test(output.filename);
  },
  output: function(project, output, callback) {
    writeResourceFile(project, output.outputFilename, output.includes);
    callback();
  }
};

// 输出资源文件
// 目前规则暂时简单点. 只支持有限的通配符，和目录深度。或者就是完全匹配正则.
// 'sites': ['sites/*.js'] 把sites/*.js目录中的文件copy到 sites目录.
function writeResourceFile(project, outputFilename, includes) {
  var resourceFile = [];

  var resDirPath = path.join(project.distDirectory, outputFilename);
  if (includes === 'default') {
    fsExt.writeFileSync(resDirPath, project.getModuleCode(outputFilename));
  } else {

    // 文件路径
    fsExt.mkdirS(resDirPath);

    if (typeof includes === 'string') {
      includes = [includes];
    }

    includes.forEach(function(include) {
      resourceFile = resourceFile.concat(getResourceFile(project,
          include));
    });
    resourceFile.forEach(function(filename) {
      var filenamePath = path.join(resDirPath, path.basename(filename));
      fsExt.writeFileSync(filenamePath, project.getModuleCode(filename));
    });
  }
}

function getResourceFile(project, filename) {
  var resourceDir;

  if (filename.indexOf('*') > 0) {
    var resourceFileDir = path.dirname(filename);
    resourceDir = path.join(project.buildDirectory, resourceFileDir);
    return fs.readdirSync(resourceDir).map(function(filename) {
      return path.join(resourceFileDir, filename);
    });
  } else {
    return [filename];
  }
}


var AllRule = {
  check: function(outputFilename, includes) {
    return isJs(outputFilename) && includes === '*';
  },
  output: function(project, outputFilename, includes, callback) {

  },

  getIncludes: function(project, includes, callback) {
               
  }
};

// js合并在输出之前，会进行规整，所以统一成一个函数即可.
var jsOutput = function(project, outputFilename, includes, callback) {

};

var LocalRule = {
  check: function(outputFilename, includes) {
    return isJs(outputFilename) && includes === '.';
  },
  output: jsOutput, 
  getIncludes: function(project, includes, callback) {
               
  }
};

var DefaultRule = {
  check: function(outputFilename, includes) {
    return isJs(outputFilename) && includes === 'default';
  },

  output: jsOutput,
  getIncludes: function(project, includes, callback) {
               
  }
};

var ArrayRule = {
  check: function(outputFilename, includes) {
    return isJs(outputFilename) && utils.isArray(includes);
  },

  output: jsOutput,

  getIncludes: function(project, includes, callback) {
               
  }
};


// 输出文件
Resource.prototype.writeCode = function(project, moduleName, includes) {

  var mergeModules = this.mergeModules;
  var q = this.queue;

  this.collectIncludeCode(moduleName, includes, function(files) {
    var minfile = path.join(project.distDirectory, moduleName);
    var debugfile = minfile.replace('.js', '-debug.js');
  
    fsExt.writeFileSync(debugfile, files.debugCode);
    fsExt.writeFileSync(minfile, files.minCode);
    q.push(function(callback) {
      project.compress(minfile, function(code) {
        fsExt.writeFileSync(minfile, code);
        callback(); 
      });
    });
  });
};



// 收集需要合并的文件.
Resource.prototype.collectIncludeCode = function(project, mergeModules, outputFilename, includes, callback) {
  var mergeModules = this.mergeModules;
  var q = this.queue;

  var debugCodeList = [];
  var minCodeList = [];
  var debugMobileCode = [];
  var mobileCode = [];
  includes.forEach(function(moduleName) {
    var baseCode,
      baseDebugCode,
      baseMinCode,
      debugCode,
      minCode,
      moduleId,
      baseDepList,
      debugDepList,

    baseCode = project.getModuleCode(moduleName);
    moduleId = project.getModuleId(moduleName);

    baseCode = filterTplRequire(project, moduleName, baseCode);

    baseDebugCode = filterLocalRequire(project,
        moduleName, baseCode, '-debug');

    baseMinCode = filterLocalRequire(project, moduleName, baseCode, '');

    baseDepList = project.getModuleDepMapping(moduleId);
    debugDepList = baseDepList.map(function(dep) {
      return dep + '-debug';
    });
//console.log(moduleId, baseDepList)

    debugCode = filterGlobalRequire(project,
        moduleName, baseDebugCode, '-debug');

    minCode = filterGlobalRequire(project, moduleName, baseMinCode, '');

    debugCode = filterIdAndDeps(debugCode,
        moduleId + '-debug', getDepStr(moduleId + '-debug', debugDepList, mergeModules));

    minCode = filterIdAndDeps(minCode, moduleId, getDepStr(moduleId, baseDepList, mergeModules));

    debugCodeList.push(debugCode);
    minCodeList.push(minCode);
  });

  callback({
    debugCode: debugCodeList.join('\n\n'),
    //minCode: compress(minCodeList.join('\n\n')),
    minCode: minCodeList.join('\n\n')
  });
};

function isJs(filepath) {
  return path.extname(filepath) === '.js';
}



