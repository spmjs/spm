var path = require('path');
var async = require('async');
var Rule = require('./rule.js');
require('shelljs/global');

var fsExt = require('../../utils/fs_ext.js');
var StringUtils = require('../../utils/string.js');
var Graph = require('../../utils/dep_graph.js');
var moduleHelp = require('../../utils/module_help.js');
var Sources = require('../../core/sources.js');

var isCss = moduleHelp.isCss;
var isRelative = moduleHelp.isRelative;

// 默认合并规则基类.
var cssRule = Rule.createRule('CssRule');

cssRule.check = function(filename) {
  return isCss(filename);
};

cssRule.getIncludes = function(handler, filename, includes, callback) {
  if (typeof includes === 'string') {
    if (/^(?:default|\.|\*)$/.test(includes)) {
      includes = filename;
    }
    includes = [includes];
  }
  callback(includes);
};

cssRule.output = function(ruleHandler, filename, includes, callback) {
  var project = ruleHandler.project;
  var build = project.buildDirectory;
  var dist = project.distDirectory;

  var resDirPath = path.join(dist, filename);

  // 如果用户输出目录.
  mkdir('-p', path.dirname(resDirPath));

  var codeList = [];

  async.forEachSeries(includes, function(include, callback) {
    if (/\w+/.test(include)){
      // 存在别名替换.
      include = project.getGlobalModuleId(include, true);
    }

    if (include.indexOf('.') != 0 && moduleHelp.isRelative(include, build)) {
      include = './' + include;
    }

    if (isHttpFile(include)) {
      include = StringUtils.tmpl(include, project);

      Sources.loadUrl(include, function(body) {
        if (body) {
          codeList.push(body);
        }
        callback();
      });
      return;
    }

    // css 合并全局模块，必须添加后缀. 
    if (path.extname(include) !== 'css' && include.indexOf('/') < -1) {
      throw new Error('Illegal dependnecies ' + include + ':' + gId);    
    }

    if (include.indexOf('.') === 0) {
      codeList.push(fsExt.readFileSync(build, include));
      callback();
    } else {
      project.getGlobalModuleCode(getDebugName(include, '-debug'), function(code) {
        codeList.push(code);
        callback();
      });
    }
  }, function() {
    var modId = project.getModuleId(filename);

    codeList.unshift('/** ' + modId + ' **/');
    var codes = codeList.join('\n');
    var dist = project.distDirectory;

    var debug = project.debugName;
    debug = debug ? ('-' + debug) : debug;

    // 开始处理全局模块依赖，并生成 -full.css , debug css
   
    var fullname = getDebugName(filename, '-full');

    var moduleFile = path.join(dist, filename);
    var fullModuleFile = path.join(dist, fullname);

    var debugModuleFile = path.join(dist, getDebugName(filename, debug));
    var debugModuleFullFile = path.join(dist, getDebugName(fullname, debug));

    new GlobalDepParse(project, modId, codes, function(depMapping, depCode, codes) {

      var moduleCodes = depMapping + '\n' + codes;
      var fullCodes = depCode + '\n' + codes; 

      fsExt.writeFileSync(moduleFile, moduleCodes);
      fsExt.writeFileSync(debugModuleFile, moduleCodes);

      fsExt.writeFileSync(fullModuleFile, fullCodes);
      fsExt.writeFileSync(debugModuleFullFile, fullCodes);
      callback();
    });
  });
};

function isHttpFile(f) {
  return f.indexOf('http') === 0;
}

function getDebugName(filename, debug) {
  var ext = path.extname(filename);
  if (ext) {
    return filename.replace(new RegExp('\\' + ext + '$'), debug + ext);
  } else {
    return filename + debug;
  }
}

function GlobalDepParse(project, modId, code, cb) {
  this.project = project;
  this.cb = cb;
  this.code = code;
  var graph = this.graph = new Graph();
  
  // 开始构造依赖图
  var baseNode = this.graph.add(modId);
  this.parse(baseNode);
}

GlobalDepParse.prototype = {
  parse: function(baseNode) {
    var that = this;
    var parsedCode = parseDep(this.code);
    this.code = parsedCode.code;
    var project = this.project;
    var graph = this.graph;

    // 记录那些全局模块已经处理过了.
    var explored = [];

    async.forEach(parsedCode.deps, function(dep, callback) {
      var depId = project.getGlobalModuleId(dep, true); 
      var depNode = graph.add(depId);
      baseNode.addEdge(depNode);
      that.parseGlobalCode(depNode, depId, explored, callback);
    }, function() {

      //var sorted = graph.sort();
      var sorted = Graph.findSubNodeDepPath(graph)[0];
      that.cb(that.getDepMapping(sorted, false), that.getDepMapping(sorted.reverse(), true), that.code);
    });
  },
  /**
   * 根据我们约定好的代码，去 parse 依赖的模块的依赖层级.
   */
  parseGlobalCode: function(node, depId, explored, cb) {
    var project = this.project;
    var that = this;

    project.getGlobalModuleCode(getDebugName(depId, '-debug'), function(moduleCode) {
      explored.push(depId);
      var subNodes = that._parseGlobalCode(node, moduleCode, explored);

      async.forEachSeries(subNodes, function(subNode, cb) {
        that.parseGlobalCode(subNode.node, subNode.id, explored, cb); 
      }, function() {
        cb();
      });
    });
  },
  _parseGlobalCode: function(node, code, explored) {
    var graph = this.graph;
    var reg = /\/(\*+) dependency: @import url\(([^)]+)\) \1\//gm;
    var lines = code.split('\n');
    var nodeStack = [node];
    var subNodes = [];

    code = code.replace(reg, function(match, depth, id) {
      var subNode;
      if (depth.length == 1) {
        subNode = graph.add(id);
        node.addEdge(subNode);
        nodeStack.push(subNode);
      } else if (depth.length == 2){
        subNode = graph.add(id);
        var baseNode = nodeStack[nodeStack.length-1];
        baseNode.addEdge(subNode);
      }
      
      if (explored.indexOf(id) < 0) {
        subNodes.push({
          node: subNode,
          id: id
        });
      }
      // 添加依赖的子模块，需要继续处理.
      return '';
    });

    // 存储模块对应的 css 代码.
    node.data = code;
    return subNodes;
  },
  // 根据 graph 生成依赖关系，或者依赖的模块代码
  getDepMapping: function(sorted, loadCode) {
    var that = this;
    var codes = [];
    sorted.forEach(function(node) {
      if (!node.depth) return;
      codes.push(that._getNodeDepMapping(node, loadCode));
    });
    return codes.join('\n');
  },
  _getNodeDepMapping: function(node, loadCode) {
    if (loadCode) {
      return node.data;
    } else {
      return '/' + repeatStr('*', node.depth) + ' dependency: @import url(' + node.name + ') ' + repeatStr('*', node.depth) + '/'; 
    }
  }
};

var cssImportReg = /^@import\s+(?:url\s*\(\s*['"]?|['"])((?!http:|https:|ftp:|\/\/)[^"^'^\s]+)(?:['"]?\s*\)|['"])\s*([\w\s\(\)\d\:,\-]*);.*$/gm;

function parseDep(code) {
  var deps = [];
  code = code.replace(cssImportReg, function(match, dep) {
    if (dep.indexOf('.') != 0) {
      deps.push(dep);
      return '';
    } else {
      console.warn('发现了不合法的import 内容' + match);
      return match;  
    }
  });

  return {
    code: code,
    deps: deps
  };
}

function repeatStr(str, time) {
  if (!time || time < 0) {
    throw new Error('不合法的参数');
  }
  time--;

  while(time--) {
    str = str + str; 
  }
  return str;
}

module.exports = cssRule;
