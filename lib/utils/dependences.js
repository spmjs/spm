'use strict';

var UglifyJS = require('uglify-js');
var path = require('path');
var _ = require('underscore');

var fsExt = require('./fs_ext.js');
var moduleHelp = require('./module_help.js');

var Dependences = exports;

function parse(inputFile, moduleId) {
  var ast = getAst(inputFile);
  var deps = parseStatic(ast, moduleId);

  if (deps === undefined) {
    deps = parseDynamic(ast);
  }
  return deps;
}

// 将会返回 ['dep1', 'dep2']
/**
 * 解析模块静态依赖
 * examples
 * 1. define('id', ['dep1', 'dep2'], function(require, exports, module) {
 * 返回 ['dep1', 'dep3']
 *
 * 2. define(functon() {}) define(['abc']); define({}) 
 * 上面这种信息不完整的模块 返回 []
 *
 * 3. define('id', ['dep1', 'dep2'], ['abc', 'def']);
 * 返回 ['dep1', 'dep3'] 其中需要排除 abc, def 的干扰
 *
 * 4. define('id', ['dep1', 'dep2'], {['abc', 'def']});
 * 返回 ['dep1', 'dep3'] 其中需要排除 abc, def 的干扰
 */
function parseStatic(ast, id) {
  ast = getAst(ast);

  var deps = [];
  var call_define_expression = null;
  var arr_expression = null;

  // 保存模块的 id，处理合并模块的时候使用.
  var defineId = null;

  // 保存 define 的第二个参数，避免第三个参数的干扰 解决 上面 3 的情况.
  var arg2 = null;

  var walker = new UglifyJS.TreeWalker(function(node, descend) {
    if (isCmdDefine(node)) {

      arg2 = node.args[1];
      defineId = node.args[0].getValue();

      // 如果用户指定 id(因为模块可能是合并模块), 需要找到对应的 id的依赖.
      if (id && id !== defineId) {
        return false;
      }

      var temp = call_define_expression;
      call_define_expression = node;
      descend();
      call_define_expression = temp;
      return true;
    }

    if (node instanceof UglifyJS.AST_Lambda) {
      var tmp = call_define_expression;
      call_define_expression = null;
      descend();
      call_define_expression = tmp;
      return true;
    }

    var parentNode = walker.parent();

    if (call_define_expression &&
          node instanceof UglifyJS.AST_Array &&
          parentNode.expression &&
          parentNode.expression.name === 'define') {

      // 我们只解析第二个参数.
      if (arg2 !== node) {
        return false;
      }

      var temp = arr_expression;
      arr_expression = node;
      descend();
      arr_expression = temp;
      return true;
    }

    if (arr_expression && node instanceof UglifyJS.AST_String) {
      deps.push(node.getValue());
    }
  });

  ast.walk(walker);
  return deps.length ? deps : undefined;
}

// 解析动态依赖，主要通过找到代码中的 require('jquery'); 语句。
// ['jquery']
function parseDynamic(ast) {
  ast = getAst(ast);
   
  var deps = [];
  var call_expression = null;

  var walker = new UglifyJS.TreeWalker(function(node, descend) {
    if (node instanceof UglifyJS.AST_Call &&
        node.start.value === 'require' &&
        node.expression.name === 'require') {

      var temp = call_expression;
      call_expression = node;
      descend();
      call_expression = temp;
      return true;
    }
    
    if (call_expression && node instanceof UglifyJS.AST_String) {
      deps.push(node.getValue());
    }
  });

  ast.walk(walker);
  return deps;
}

// 一个模块可能有多个模块合并而成，需要 parse 这个文件是那几个模块组成。
function parseDefine(ast, isOriMod) {
  ast = getAst(ast);
  var ids = [];

  var walker = new UglifyJS.TreeWalker(function(node, descend) {
    if (isCmdDefine(node, isOriMod)) {

      var idNode = node.args[0];

      if (idNode instanceof UglifyJS.AST_String) {
        ids.push(idNode.getValue());
      }
      return false;
    }
  });

  ast.walk(walker);
  return ids;
}

// 检查指定模块是否包含标准的 define. 
// isOriMod 可以控制检查是原始的，还是已经处理过的.
function hasDefine(ast, isOriMod) {
  ast = getAst(ast);
  var hasDefine = false;

  var walker = new UglifyJS.TreeWalker(function(node, descend) {
    if (isCmdDefine(node, isOriMod)) {
      hasDefine = true;
      return false;
    }
  });

  ast.walk(walker);
  return hasDefine;
}

// 判断这个节点是否是 define 节点.
// isOriMod 控制是原始的，还是处理过的.
function isCmdDefine(node, isOriMod) {
  var argLen = 3;

  // 如果是没有编译过的模块, 参数为 1.
  if (isOriMod) {
    argLen = 1; 
  }

  return node instanceof UglifyJS.AST_Call &&
       node.start.value === 'define' &&
       node.args &&
       node.args.length === argLen;
}

function getAst(inputFile) {
  if (!_.isString(inputFile)) return inputFile;

  if (fsExt.existsSync(inputFile)) {
    inputFile = fsExt.readFileSync(inputFile);
  }

  return UglifyJS.parse(inputFile, {
    comments: true
  });
}

Dependences.parse = parse;
Dependences.parseStatic = parseStatic;
Dependences.parseDynamic = parseDynamic;
Dependences.parseDefine = parseDefine;
Dependences.getAst = getAst;
Dependences.hasDefine = hasDefine;

