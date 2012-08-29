
// 项目文件合并
// 其中合并后的文件会存放到 build/dist 目录中。
// 在合并后的文件中，会对依赖进行分析处理替换。

var path = require('path');
var fs = require('fs');
var async = require('async');

var fsExt = require('../utils/fs_ext.js');
var moduleHelp = require('../utils/moduleHelp.js');
var cssCompress = require('../compress/css_compress.js');

var normalize = moduleHelp.normalize;
var isRelative = moduleHelp.isRelative;
var isJs = moduleHelp.isJs;

var Plugin = require('../core/plugin.js');

var outputPlugin = module.exports = Plugin.create('output');

outputPlugin.param('build', '%buildDirectory%');
outputPlugin.param('dist', '%distDirectory%');

// 项目文件合并输出.
outputPlugin.run = function(callback) {
  var project = this.project;

  var output = project.output;
  // 如果没有配置output, 默认把build目录copy到dist目录.
  if (!output) {
    fsExt.copydirSync(this.build, this.dist);
    callback();
    return;
  }

  var handler = new RuleHandler(project, output);

  // TODO 动态加载规则处理列表.
  handler.add(DefaultRule);
  handler.add(ArrayRule);
  handler.add(LocalMergeRule);
  handler.add(AllMergeRule);
  handler.add(SeajsMergeRule);
  handler.add(CompositeMergeRule);
  handler.add(CssRule);
  handler.add(ResourceRule);

  async.series([
    function(callback) {

      // 对includes进行整理，主要针对js模块.
      handler.perfectIncludes(callback);
    },

    function(callback) {

//log('begin merge file :', output);
      // 开始输出，输出的时候需要进行过滤。
      // 首先需要把合并的模块规整成一个id数组。
      // 然后在includes里面每合并一项，就检查是否存在，如果存在就需要把他已经合并的文件从includes中删除。
      handler.merge(callback);
    }
   ], function() {
    callback();
  });
};

var RuleHandler = function(project, output) {
  this.project = project;
  this.output = output;
  this._rules = [];
  this.globalExcludes = project.resolvedDeps || [];
  this.collectOutputExcludes();
};

RuleHandler.prototype.add = function(rule) {
  this._rules.push(rule);
};

RuleHandler.prototype.collectOutputExcludes = function() {
  var project = this.project;
  var output = project.output;
  var that = this;
  Object.keys(output).forEach(function(o) {
    if (o === '*') {
      // find global excludes.
      var excludes = output[o].excludes;
      if (typeof excludes === 'string') {
        excludes = [excludes];
      }
      excludes = fsExt.globFiles(excludes, project.buildDirectory);
      if (excludes && excludes.length) {
        excludes.forEach(function(exclude) {
          if (that.globalExcludes.indexOf(exclude) < 0) {
            that.globalExcludes.push(exclude); 
          }
        })
      }
      delete output['*'];
    }
  });
};


RuleHandler.prototype.loop = function(handler, callback) {
  var that = this;
  var output = this.output;

  // 迭代遍历所有的输出项，找到合适的规则处理器，然后规整Inclues的内容.
  async.forEachSeries(Object.keys(output), function(filename, callback) {
  if (!filename) callback();
    var includes = output[filename];

    that.find(filename, includes, function(rule) {
      if (!rule) {

        // 如果没有找到规则，抛出错误.
        throw '[spm ouput plugin] output parse error!(' + filename + ': ' + includes + ')';
      }

      handler(rule, filename, includes, callback);
    });
  }, function() {
    callback && callback();
  });
};

// 遍历所有的output,然后对用户配置的mergeRule 进行解析:
// 1. 对于内部模块，返回模块路径即可。
// 2. 对于全局模块，返回仓库的文件地址。(TODO debug看看怎么处理)
RuleHandler.prototype.perfectIncludes = function(callback) {
  var output = this.output;
  var that = this;

  var handler = function(rule, filename, includes, callback) {
     rule.getIncludes(that, filename, includes, function(includes) {
      output[filename] = includes;
      callback();
    });
  };

  this.loop(handler, callback);
};

// 合并文件并输出.
// 由于我们需要对合并的文件进行依赖替换，所以我们可以进行缓存。
RuleHandler.prototype.merge = function(callback) {
  var that = this;

  var handler = function(rule, filename, includes, callback) {
    rule.output(that, filename, includes, callback);
  };

  this.loop(handler, callback);
};

RuleHandler.prototype.hasOutput = function(moduleName) {
  moduleName = normalize(moduleName);
  var includes = this.output[moduleName];

  // 如果只包含自己一个模块，那么忽略.
  return includes && includes.length > 1;
};

/**
 * baseModule: plugins/p1.js
 * depModule: ../a.js
 * ===> ./a.js
 * baseModule: p).js
 * depModule: ./plugins/p1.js
 * ===> ./plugins/p1.js
 * baseModule: p1.js
 * depModule: ./a.js
 * ===> ./a.js;
 */
function getDepModule(baseModule, depModule) {
  return normalize(path.join(path.dirname(baseModule), depModule));
}

// 根据ouput的每一个输出规则找到合适的处理器进行处理.
RuleHandler.prototype.find = function(filename, includes, callback) {
  async.detectSeries(this._rules, function(rule, callback) {
    callback(rule.check(filename, includes));
  }, callback);
};


// js合并在输出之前，会进行规整，所以统一成一个函数即可.
var jsOutput = function(ruleHandler, filename, includes, callback) {
  var project = ruleHandler.project;
  var output = ruleHandler.output;
  var globalExcludes = ruleHandler.globalExcludes;

  var debugCode;
  var code;
  var codeList = [];
  var debugCodeList = [];

  // Fix #248 全局excldes的检查.
  includes = includes.filter(function(include) {
    console.log('----', include, globalExcludes.indexOf(include));
    return  globalExcludes.indexOf(include) < 0; 
  });

  async.forEachSeries(includes, function(include, callback) {
    if (isRelative(include)) {
      var moduleCode = project.getModuleCode(moduleHelp.getBaseDepModulePath(filename, include));
      var moduleId = project.getModuleId(include);

      // 获取此模块的依赖关系，然后准备检查依赖的相对模块是否存在与输出列表中.
      var deps = project.getDepMapping(include) || [];
      var depsCheck = deps.slice(0);

      // 我们先收集所依赖模块中存在的合并模块，然后统一删除.
      var allMergedMods = [];
      var dep;
      while (dep = depsCheck.pop()) {
        if (!isRelative(dep)) {
          continue;
        }
        var depModule = getDepModule(include, dep);

        // 把需要清除的模块统一收集起来.
        // TODO TEST 需要考虑循环依赖的话，可能把模块都删除掉.
        if (ruleHandler.hasOutput(depModule)) {
          var mergedModules = output[depModule].filter(function(mod) {
            return mod !== depModule;
          });
          [].splice.apply(allMergedMods, [allMergedMods, 0].concat(mergedModules));
        }
      }
      moduleHelp.unique(allMergedMods);

      // 开始统一从dep中删除合并依赖模块.
      deps = deps.filter(function(dep) {
        return allMergedMods.indexOf(normalize(dep)) < 0;
      });

      var debugDeps = deps.map(function(dep) {
        return dep + '-debug';
      });

      // 然后在用这些deps对代码进行替换.
      debugCode = filterIdAndDeps(moduleCode, moduleId + '-debug', debugDeps);
      debugCode = filterRequire(project, debugCode, '-debug');

      code = filterIdAndDeps(moduleCode, moduleId, deps);
      code = filterRequire(project, code, '');
      codeList.push(code);
      debugCodeList.push(debugCode);
      callback();

    } else {
      async.series([
        function(callback) {
          project.getGlobalModuleCode(include + '-debug', function(moduleCode) {
            debugCode = moduleCode;
            callback();
          });
        }, function(callback) {
          project.getGlobalModuleCode(include, function(moduleCode) {
            code = moduleCode;
            callback();
          });
        }
      ], function() {
        codeList.push(code);
        debugCodeList.push(debugCode);
        callback();
      });
    }

  }, function() {
    var codes = codeList.join('\n\n');
    var debugCodes = debugCodeList.join('\n\n');

    var moduleFile = path.join(project.distDirectory, filename);
    var debugModuleFile = moduleFile.replace(/\.js$/, '-debug.js');

    fsExt.writeFileSync(moduleFile, codes);
    fsExt.writeFileSync(debugModuleFile, debugCodes);
    callback();
  });
};

function filterIdAndDeps(code, moduleId, deps) {

  return code.replace(/\s*define\s*\(\s*function/,
      'define("' + moduleId + '", [' + getDepStr(deps) + '], function');
}

function getDepStr(depList) {
  return depList.length ? '"' + depList.join('", "') + '"' : '';
}

// 对代码文件中依赖的模块，进行替换. 主要是增加debug
function filterRequire(project, code, debug) {
  var modPattern = project.getReqModRegByType('[^\"\']+');
  return code.replace(modPattern, function(match, sep, mark, depModName) {

    if (/(\.css|\.tpl|.coffee|.less)/.test(depModName)) {
      return match;
    }
    if (isRelative(depModName)) {
      return " require('" + depModName + debug + "')";
    }

    var globalModuleId = project.getGlobalModuleId(depModName);
    return sep + "require('" + globalModuleId + debug + "')";
  });
}

var DefaultRule = {
  id: 'DefaultRule',

  check: function(outputFilename, includes) {
    return isJs(outputFilename) && includes === 'default';
  },

  output: jsOutput,

  getIncludes: function(handler, filename, includes, callback) {
    callback([normalize(filename)]);
  }
};

var ArrayRule = {
  id: 'ArrayRule',

  check: function(outputFilename, includes) {
    return isJs(outputFilename) && Array.isArray(includes);
  },

  output: jsOutput,

  getIncludes: function(handler, filename, includes, callback) {
    callback(includes.map(function(include) {
      return normalize(include);
    }));
  }
};

var LocalMergeRule = {

  id: 'LocalMergeRule',

  check: function(outputFilename, includes) {
    return isJs(outputFilename) && includes === '.';
  },

  output: jsOutput,

  getIncludes: function(handler, filename, includes, callback) {
    var project = handler.project;
    var deps = project.getDepMapping(filename) || [];
    var newDeps = [];
    deps.filter(function(dep) {
      if (isRelative(dep)) {
        newDeps.push(normalize(dep));
      }
    });

    newDeps.push(normalize(filename));
    callback(newDeps);
  }
};

var AllMergeRule = {

  id: 'AllMergeRule',

  check: function(filename, includes) {
    return isJs(filename) && includes === '*';
  },

  output: jsOutput,

  getIncludes: function(handler, filename, includes, callback) {
    var project = handler.project;
    var deps = project.getDepMapping(filename);
    var resolvedDeps = project.resolvedDeps;
    var newDeps = deps.filter(function(dep) {
      if (isRelative(dep)) {
        return true;
      }

      // 保留依赖.
      if (resolvedDeps.indexOf(dep) > -1) {
        return false;
      }
      return true;
    });
    newDeps = newDeps.map(function(dep) {
      if (isRelative(dep)) {
        return normalize(dep);
      } else {
        return dep;
      }
    });
    newDeps.push(filename);
    callback(newDeps);
  }
};

var SeajsMergeRule = {
  id: 'SeajsMergeRule',

  check: function(filename, includes) {
    return includes === 'seajs';
  },

  output: jsOutput,

  getIncludes: function(handler, filename, includes, callback) {
     AllMergeRule.getIncludes(handler, filename, includes, function(allModule) {
       allModule.unshift('#seajs/1.2.0/sea');
       callback(allModule);
     });
  }
};

// 默认合并规则基类.
var CssRule = {
  id: 'CssRule',

  check: function(filename) {
    return /.css$/.test(filename);
  },

  getIncludes: function(handler, filename, includes, callback) {
    if (typeof includes === 'string') {
      if (includes === 'default') {
        includes = filename;
      }
      includes = [includes];
    }
    callback(includes);
  },

  output: function(ruleHandler, filename, includes, callback) {
    var project = ruleHandler.project;
    var build = project.buildDirectory;

    var resDirPath = path.join(project.distDirectory, filename);
    var outputFilePath = path.join(build, filename);
    var codes = [];

    includes.forEach(function(include) {
      codes.push(path.join(fsExt.readFileSync(build, include)));
    });

    fsExt.writeFileSync(outputFilePath, codes.join('\n\n'));

    cssCompress(outputFilePath, function(code) {
      fsExt.writeFileSync(resDirPath, code);
      callback();
    });
  }
};

var ResourceRule = {
  id: 'ResourceRule',
  check: function(output) {
    return /^[_\w-]+$/.test(output.filename);
  },

  getIncludes: function(handler, filename, includes, callback) {
    callback(includes);
  },

  output: function(ruleHandler, filename, includes, callback) {
    var project = ruleHandler.project;
    var output = ruleHandler.output;

    writeResourceFile(project, filename, includes);
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

var CompositeMergeRule = {
  id: 'CompositeMergeRule',

  check: function(filename, includes) {
    return isJs(filename) && 
        (typeof includes === 'object') && 
        (includes.excludes || includes.includes);
  },

  output: jsOutput,

  getIncludes: function(handler, filename, includes, callback) {
    var project = handler.project;
    var output = project.output;
    var excludes = fsExt.globFiles(includes.excludes || [], project.buildDirectory); 
    var globalExcludes = handler.globalExcludes;
    handler.find(filename, includes.includes, function(rule) {
      rule.getIncludes(handler, filename, includes.includes, function(_includes) {
        console.log(_includes);
        _includes = _includes.filter(function(include) {
          console.log('----', include, excludes.indexOf(include),  globalExcludes.indexOf(include));
          return excludes.indexOf(include) < 0 &&
            globalExcludes.indexOf(include) < 0; 
        });
        console.log('filted includes:', _includes)
        callback(_includes);
      });
    });
  }
};

// 目前下面几个需求
// 1. 规则的执行需要同步，因为牵扯到合并，可能需要从服务器获取模块
// 2. 规则可态的从文件中获取.
// 3. 规则需要提供一个方法来检查includes，来确定是否有次规则来执行.
// 4. 系统会给规则提供project, includes, outputFilename, callback信息.
// 5. Rule可以是一个函数.

