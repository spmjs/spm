var request = require('request');
var fs = require('fs');
var path = require('path');
var async = require('async');
var semver = require('semver');
var jsonpath = require('JSONPath').eval;
var prettyJson = require('prettyjson');

var fsExt = require('../utils/fs_ext.js');
var moduleHelp = require('../utils/module_help.js');

// 工具类加载
var ActionFactory = require('../core/action_factory.js');

// 项目配置文件解析，产生出项目模型
var ProjectFactory = require('../core/project_factory.js');

var fileDir = process.cwd();
var Search = ActionFactory.create('Search');

Search.prototype.registerArgs = function() {
  var opts = this.opts;
  opts.description('查询源中指定模块的基本信息');

  opts.on('--help', function() {
    console.info();
    console.info('  ' + 'Examples:'.bold.blue);
    console.info();
    console.info('   ' + opts.description());
    console.info();
    console.info('   $ ' + 'spm search'.magenta);
    console.info();
    console.info('   查询指定模块信息');
    console.info();
    console.info('   $ ' + 'spm search'.magenta + ' ' + 'seajs'.cyan);
    console.info('   $ ' + 'spm search'.magenta + ' ' + 'arale.base'.cyan);
    console.info();
    console.info('   查看更多的文档信息: ' + 'https://github.com/spmjs/spm/wiki'.underline);
    console.info();
  });
};

var errMsg = 'Unable to get the information you need. Please check your configuration!';
Search.prototype.execute = function(options, callback) {
  search(options.extras[0], function(result) {
    var str = prettyJson.render(result);
    console.info(str);
    callback();
  });
};

var search = Search.search = function(queryStr, cb) {
  var root = '';
  var hasSubInfo = false;
  if (queryStr.indexOf('.') > 0) {
    root = queryStr.split('.')[0];
  } else {
    hasSubInfo = true;
  }

  var query = parseQuery(queryStr);
  var modInfo = Search.prototype.createOptions({});
  ProjectFactory.getProjectModel('info', modInfo, function(model) {
    model.getSourceModuleInfo(root, function(sourceModsInfo) {
      var searchResult = jsonpath(sourceModsInfo, query);
      cb(unique(searchResult));
    }, hasSubInfo);
  });
};

//$..[?(@.tag=="widget"&&@.type=="")]')
function parseQuery(queryStr) {
  if (queryStr.indexOf('=') < 0) {
    queryStr = parseName(queryStr);
  }

  var query = [];
  query.push('$..[?(');
  var parts = queryStr.split(',');

  for (var i = 0, len = parts.length; i < len; i++) {
    var subQuery = parts[i];

    if (subQuery.indexOf('=') < 0) {
      throw new Error('Illegal query! ' + queryStr, subQuery);
    }

    subQuery = subQuery.split('=');
    query.push('@.' + subQuery[0] + '=="' + subQuery[1] + '"');

    if (i < len - 1) {
      query.push('&&');
    }
  }

  query.push(')]');
  console.log('query: ' + query.join(''));
  return query.join('');
}

// 允许用户可以简化搜索条件.
// 根据用户传入的模块名称，获取模块基本信息.
// 暂时不支持版本.
function parseName(name) {
  var modInfo = {};
  var parts = name.split('@');
  var name = parts[0];
  modInfo.version = parts[1];

  modInfo.name = name;

  if (name.indexOf('.') > 0) {
    name = name.split('.');
    modInfo.root = name[0];
    modInfo.name = name.splice(1).join('.');
  }

  var queries = [];
  Object.keys(modInfo).forEach(function(key) {
    if (key == 'version') return;
    if (modInfo[key]) {
      queries.push(key + '=' + modInfo[key]);
    }
  });
  return queries.join(',');
}

function unique(result) {
  var str = JSON.stringify(result);
  var new_result = [];

  result = result.filter(function(obj) {
    var objStr = JSON.stringify(obj);
    new_result.push(objStr);

    if (new_result.indexOf(objStr) === new_result.lastIndexOf(objStr)) {
      return true;
    } else {
      return false;
    }
  });
  return result;
}

module.exports = Search;
