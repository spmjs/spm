var request = require('request');
var fs = require('fs');
var path = require('path');
var async = require('async');
var semver = require('semver');
var jsonpath = require('JSONPath').eval;
var prettyJson = require('prettyjson');

// 工具类加载
var ActionFactory = require('../core/action_factory.js');
var fsExt = require('../utils/fs_ext.js');
var help = require('../utils/module_help.js');

// 项目配置文件解析，产生出项目模型
var ProjectFactory = require('../core/project_factory.js');

var fileDir = process.cwd();
var argv;
var Search = ActionFactory.create('Search');

Search.prototype.registerArgs = function() {
  var opts = this.opts;
  opts.help('search module info.');
  opts.add('r', 'root', 'set module root.');
  opts.defaultValue('root', '');
};


var errMsg = 'Unable to get the information you need. Please check your configuration!';
Search.prototype.execute = function(options, callback) {
  argv = options;
  search(argv.extras[0], function(result) {
    var str = prettyJson.render(result);
    console.info(str);
    callback();
  });
};

var search = Search.search = function(queryStr, cb) {
  var query = parseQuery(queryStr);
  var modInfo = Search.prototype.createOptions({});
  ProjectFactory.getProjectModel('info', modInfo, function(model) {
    model.getSourceModuleInfo(function(sourceModsInfo) {
      var searchResult = jsonpath(sourceModsInfo, query);
      cb(searchResult);
    });
  });
};

//$..[?(@.tag=="widget"&&@.type=="")]')
function parseQuery(queryStr) {
  var query = [];
  query.push('$..[?(');
  var parts = queryStr.split(',');

  for (var i = 0, len = parts.length; i < len; i++) {
    var subQuery = parts[i];

    if (subQuery.indexOf('=') < 0) {
      throw new Error ('Illegal query! ' + queryStr, subQuery);
    }

    subQuery = subQuery.split('=');
    query.push('@.' + subQuery[0] + '=="' + subQuery[1] + '"');

    if (i < len -1) {
      query.push('&&');
    }
  }

  query.push(')]');
  return query.join('');
}

module.exports = Search;
