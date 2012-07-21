
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
  var output = project.output;
  // 如果没有配置output, 默认把build目录copy到dist目录.
  if (!output) {
    fsExt.copydirSync(project.buildDirectory, project.distDirectory);
    callback();
    return;
  }

  var handler = new RuleHandler(project, output); 
  handler.add(DefaultRule);
  handler.add(ArrayRule);
  handler.add(CssRule);
  handler.add(ResourceRule);
  handler.add(LocalRule);
  handler.add(AllRule);

  async.series([
    function(callback) {

      // 对includes进行整理，主要针对js模块.
      handler.perfectIncludes(callback);
    },

    function(callback) {

log('begin ouput:', output);
      // 开始输出，输出的时候需要进行过滤。
      // 首先需要把合并的模块规整成一个id数组。
      // 然后在includes里面每合并一项，就检查是否存在，如果存在就需要把他已经合并的文件从includes中删除。
      handler.merge(callback); 
    }
   ], function() {
    console.log('');
    console.log( 'Successfully build project!');
    console.log('');
    callback();
  });
};

var RuleHandler = function(project, output) {
  this.project = project;
  this.output = output;
  this._rules = [];
};

RuleHandler.prototype.add = function(rule) {
  this._rules.push(rule);
};

// 遍历所有的output,然后对用户配置的mergeRule 进行解析:
// 1. 对于内部模块，返回模块路径即可。
// 2. 对于全局模块，返回仓库的文件地址。(TODO debug看看怎么处理)
RuleHandler.prototype.perfectIncludes = function(callback) {
  var output = this.output;
log('perfectIncludes--->output: ', output);
  var that = this;
  var handler = function(filename, includes, callback) {
    that.find(filename, includes, function(rule) {
      console.log('find rule------->');
      if (!rule) {

        // 如果没有找到规则，抛出错误.
        throw 'output parse error!(' + filename + ': ' + includes + ')';
      } else {
        console.log(filename, ' find rule ' + rule.id);
        rule.getIncludes(that.project, filename, includes, function(includes) {
          output[filename] = includes;
          callback();
        });
      }
    });
 
  }
  this.loop(handler, callback);
};

RuleHandler.prototype.loop = function(handler, callback) {
 // 迭代遍历所有的输出项，找到合适的规则处理器，然后规整Inclues的内容.
  var output = this.output;
  async.forEachSeries(Object.keys(output), function(filename, callback) {
  if (!filename) callback();
log('loop---->', filename);

    var includes = output[filename];
    handler(filename, includes, callback);
  }, function() {
    callback && callback();
  });
};

// 合并文件并输出.
// 由于我们需要对合并的文件进行依赖替换，所以我们可以进行缓存。
RuleHandler.prototype.merge = function(callback) {
  var that = this;
  var project = this.project;
  var output = this.output;
  var codeList = [];

  var handler = function(filename, includes, callback) {
log('merge----->', filename, includes);
    includes.forEach(function(include) {
      var code = project.getModuleCode(include);
      
      // 获取此模块的依赖关系，然后准备检查依赖的相对模块是否存在与输出列表中.
      var deps = project.getDepMapping(include);
console.log('oriDeps-->', include, deps);
      var depsCheck = deps.slice(0);

      // 我们先收集所有依赖模块中存在的合并模块，然后统一删除.
      var allMergedMods = [];
      var dep;
      while (dep = depsCheck.pop()) {
        if (!isRelative(dep)) {
          continue;
        }

        var depModule = getDepModule(include, dep);
        if (that.hasOutput(depModule)) {
          // 2. 从deps清除这些模块
          // 3. 然后在用这些deps对代码进行替换.
          // 
          var mergedModules = output[depModule].filter(function(mod) {
            return mod !== depModule;
          });
          
          [].splice.apply(allMergedMods, [allMergedMods, 0].concat(mergedModules));
        }
      }

      unique(allMergedMods);
      // 开始统一的删除合并依赖模块.
      deps = deps.filter(function(dep) {
        return allMergedMods.indexOf(normalize(dep)) < 0;
      });
console.log('newDeps-->', include, deps);
    });
    callback();
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
 * baseModule: p1.js
 * depModule: ./plugins/p1.js
 * ===> ./plugins/p1.js
 * baseModule: p1.js
 * depModule: ./a.js
 * ===> ./a.js;
 */
function getDepModule(baseModule, depModule) {
  return normalize(path.join(path.dirname(baseModule), depModule));
}

function isEqual(moduleA, moduleB) {
  return path.normailze(moduleA) == path.normailze(moduleB);
}

// 根据ouput的每一个输出规则找到合适的处理器进行处理.
RuleHandler.prototype.find = function(filename, includes, callback) {
console.log('find------')
  async.detectSeries(this._rules, function(rule, callback) {
    callback(rule.check(filename, includes));  
  }, callback);
};



// 目前下面几个需求
// 1. 规则的执行需要同步，因为牵扯到合并，可能需要从服务器获取模块
// 2. 可以很方便的添加新规则。
// 3. 规则可态的从文件中获取.
// 4. 规则需要提供一个方法来检查includes，来确定是否有次规则来执行.
// 5. 系统会给规则提供project, includes, outputFilename, callback信息.
// 6. Rule可以是一个函数.
//

var DefaultRule = {
  id: 'DefaultRule',

  check: function(outputFilename, includes) {
    return isJs(outputFilename) && includes === 'default';
  },

  output: jsOutput,

  getIncludes: function(project, filename, includes, callback) {
    callback([normalize(filename)]);
  }
};

var ArrayRule = {
  id: 'ArrayRule',

  check: function(outputFilename, includes) {
    return isJs(outputFilename) && util.isArray(includes);
  },

  output: jsOutput,

  getIncludes: function(project, filename, includes, callback) {
console.log('includes------->', includes)
    callback(includes.map(function(include) {
      return normalize(include);
    }));
  }
};

// 默认合并规则基类.
var CssRule = {
  id: 'CssRule',
  check: function(filename) {
    return /.css$/.test(filename);
  },
  getIncludes: function(project, filename, includes, callback) {
    callback([filename]);          
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
  id: 'ResourceRule',
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
  id: 'AllRule',
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
  id: 'LocalRule',
  check: function(outputFilename, includes) {
    return isJs(outputFilename) && includes === '.';
  },
  output: jsOutput, 
  getIncludes: function(project, includes, callback) {
               
  }
};


function isJs(filepath) {
  return path.extname(filepath) === '.js';
}

function isRelative(id) {
  return id.indexOf('./') === 0 || id.indexOf('../') === 0
}

// 规整内部依赖模块
// ./module/p.js ==> plugin/p.js
// ./module ==> module.js
function normalize(module) {
  module = path.normalize(module);
  if (path.extname(module) !== '.js') {
    module += '.js';
  }
  return module;
}


function unique(arr) {
  var o = {};
  arr.forEach(function(item) {
    o[item] = 1;
  });

  return Object.keys(o);
}

function log() {
  console.log.apply(console, ['>>> '].concat([].slice.call(arguments)));
}


