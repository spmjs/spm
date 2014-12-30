#!/usr/bin/env node

module.exports = function(nico) {

  var exports = {};

  var ReactTools = require('react-tools');
  var path = require('path');
  var util = require('util');
  var file = nico.sdk.file;
  var glob = nico.sdk.file.glob;
  var BaseWriter = nico.BaseWriter;
  var getDependencies = require('../sdk/module').getDependencies;
  var getSourceFiles = require('../sdk/module').getSourceFiles;
  var crequire = require('crequire');

  function MochaWriter() {}
  util.inherits(MochaWriter, BaseWriter);

  MochaWriter.prototype.run = function() {
    var option = nico.sdk.option;
    var dest = path.join(option.get('outputdir'), 'tests/runner.html');
    this.render({
      destination: dest,
      template: 'mocha-runner.html'
    });
  };
  nico.MochaWriter = MochaWriter;

  exports.name = 'spmjs';
  exports.version = '1.0';
  exports.lang = 'en';

  exports.reader = function(post) {
    var filename = post.meta.filepath.toLowerCase();
    if (filename === 'history.md') {
      post.template = post.meta.template = 'history';
    } else {
      post.template = post.meta.template = (post.meta.template || 'post');
    }
    if (filename === 'readme.md') {
      post.filename = post.meta.filename = 'index';
      post.meta.category = 'docs';
    }
    if (!post.meta.category) {
      post.meta.category = post.meta.directory;
    }
    return post;
  };

  var pkg = require(path.join(process.cwd(), 'package.json'));
  if (!pkg || !pkg.spm) {
    console.log('  package.json or "spm" key missing.');
    process.exit(2);
  }
  pkg.spm.tests = pkg.spm.tests || 'tests/**/*-spec.js';
  pkg.spm.main = pkg.spm.main || 'index.js';

  exports.filters = {
    find: function(pages, cat) {
      var ret = findCategory(pages, cat);
      if (ret.length) return ret[0];
      return null;
    },
    find_category: findCategory,
    // 对 CommonJS 的演示代码进行包裹使其能正常运行
    replace_code: function(content) {
      var scriptExp = /(<script>)([\s\S]*?)(<\/script>)/gi;
      var scriptExp2 = /(<script>)([\s\S]*?)(<\/script>)/i;
      // 生成一个随机 ID
      var seaTempId = Date.now();
      content = content.replace(scriptExp, function(replacement) {
        var match = scriptExp2.exec(replacement);
        if (!match) {
          return replacement;
        }
        var code = match[2];
        // 转换 jsx 代码
        if (code.indexOf('/** @jsx React.dom */') > -1) {
          code = ReactTools.transform(code);
        }
        // 转换 require 内容里的 /$ 为 /index$
        code = crequire(code, function(item) {
          var ret = item.path;
          if (ret.slice(-1) === '/') {
            ret = ret + 'index';
          }
          return 'require("'+ret+'");';
        });
        // 使用 seajs.use 调用的代码不包裹
        // 其他则视作 CommonJS 代码，包括为 CMD 格式并用 seajs.use 进行启动
        if (code.indexOf('seajs.use') < 0) {
          code = 'define("./' + seaTempId +'", function(require) {' +
                    code +
                 '});seajs.use("./' + seaTempId + '")';
        }
        // 递增页面上的随机 ID
        seaTempId += 1;
        return match[1] + code + match[3];
      });
      return content;
    },
    is_runtime_handlebars: function() {
      var src = findSrc();
      for (var key in src) {
        if (/\.handlebars$/.test(src[key])) {
          return true;
        }
      }
      return false;
    },
    // 有 .tpl 的要插入 plugin-text
    is_plugin_text: function() {
      var src = findSrc();
      for (var key in src) {
        if (/\.tpl$/.test(src[key])) {
          return true;
        }
      }
      return false;
    },
    add_anchor: function(content) {
      for (var i = 1; i <= 6; i++) {
        var reg = new RegExp('(<h' + i + '\\sid="(.*?)">.*?)(<\/h' + i + '>)', 'g');
        content = content.replace(reg, '$1<a href="#$2" class="anchor">¶</a>$3');
      }
      return content;
    },
    gitRepoUrl: function(url) {
      url = url.replace(/\.git$/, '');
      if (url.match(/^http/)) {
        return url;
      }
      var matcher = url.match(/^git[@:](.*?)[/:](.*)/);
      if (matcher) {
        return 'http://' + matcher[1] + '/' + matcher[2];
      } else {
        return url;
      }
    },
    fixlink: function(html) {
      // format permalink, ends without .html
      html = html.replace(/(href="[^"]+)\.md(">)/ig, '$1.html$2');
      return html;
    },
    fixIssues: function(html) {
      // format permalink, ends without .html
      pkg.repository = pkg.repository || {};
      pkg.repository.url = pkg.repository.url || '';
      var issuesUrl = this.gitRepoUrl(pkg.repository.url) + '/issues';
      html = html.replace(/\s#([0-9]+)/ig,
                          '<a href="' + issuesUrl + '/$1">#$1</a>');
      return html;
    },
    getNickName: function(html) {
      if (typeof html === 'string') {
        var reg = /^(.*) (.*)$/;
        var m = html.match(reg);
        return m ? m[1] : '';
      } else if (html.name) {
        return html.name;
      }
    },
    cleanTitle: function(title) {
      // remove <a> <img> in title
      title = (title || '').replace(/<(.*)>/g, '');
      return title;
    }
  };

  exports.functions = {

    specFiles: function() {
     var spec = pkg.spm.tests;
     var ret = glob.sync(spec);
      return ret.filter(function(item) {
        return item.indexOf('_site') < 0;
      });
    },

    dependencies: getDependencies,

    sourceFiles: function() {
      return getSourceFiles();
    }
  };

  exports.hasHistory = file.exists(path.join(process.cwd(), 'HISTORY.md'));
  exports.hasTest = pkg.spm.tests || file.exists(path.join(process.cwd(), 'tests'));

  exports.isCssModule = (function() {
    var main = pkg.spm && pkg.spm.main;
    if (main) {
      if (/\.css$/.test(main)) return true;
      else return false;
    }
    return false;
  })();

  function findCategory(pages, cat) {
    var ret = [];
    Object.keys(pages).forEach(function(key) {
      var item = nico.sdk.post.read(key);
      if (item.meta.category === cat) {
        ret.push(item);
      }
    });
    ret = ret.sort(function(a, b) {
      if (/index$/i.test(a.filename)) {
        a.meta.order = 1;
      }
      if (/index$/i.test(b.filename)) {
        b.meta.order = 1;
      }
      a = a.meta.order || 10;
      b = b.meta.order || 10;
      return parseInt(a, 10) - parseInt(b, 10);
    });
    return ret;
  }

  function findSrc() {
    return glob.sync('**/*', {cwd: path.join(process.cwd(), 'src')});
  }

  return exports;
};

