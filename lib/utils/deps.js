'use strict';

var path = require('path');
var readFile = require('fs').readFileSync;
var crequire = require('crequire');
var ReactTools = require('react-tools');
var normalizeDep = require('./normalizeDep');
var log = require('spm-log');

exports.getDeps = function(file) {
  var content = readFile(file, 'utf-8');
  var extname = path.extname(file);

  var ret = [];
  var re, m;

  // <script type="text/spm"> .... </script>
  re = /(<script type=\"text\/spm\">)([\s\S]*?)(<\/script>)/gmi;
  while((m = re.exec(content)) !== null) {
    crequire(m[2]).forEach(function(item) {
      ret.push(normalizeDep(item.path, file));
    });
  }

  // ````javascript .... ````
  if (extname.toLowerCase() === '.md') {
    re = /````(javascript|js)([\s\S]+?)````/gm;
    while ((m = re.exec(content)) !== null) {
      crequire(m[2]).forEach(function (item) {
        ret.push(normalizeDep(item.path, file));
      });
    }
  }

  return require('uniq')(ret);
};

exports.replaceDeps = function(content, file) {
  if (file) {
    content = readFile(file, 'utf-8');
  } else {
    var file_m = content.match(/<!--filepath:([^\s]+?)\s-->/);
    file = file_m && file_m[1];
    if (content && !file) {
      log.error('error', 'filepath not found');
    }
  }

  var extname = path.extname(file);
  var re, re_match;

  // for iframe syntax and html files
  // <script type="text/spm"> .... </script>
  re = /(<script type=\"text\/spm\">)([\s\S]*?)(<\/script>)/gi;
  re_match = /(<script type=\"text\/spm\">)([\s\S]*?)(<\/script>)/i;

  content = content.replace(re, function(replacement) {
    var match = re_match.exec(replacement);
    if (!match) {
      return replacement;
    }
    var code = match[2];
    code = transform(code, file);
    return match[1].replace('type="text/spm"', '') + code + match[3];
  });

  if (extname.toLowerCase() === '.md') {

    // ````javascript ... ````
    re = /(<script class=\"nico-insert-code\">)([\s\S]*?)(<\/script>)/gi;
    re_match = /(<script class=\"nico-insert-code\">)([\s\S]*?)(<\/script>)/i;

    content = content.replace(re, function (replacement) {
      var match = re_match.exec(replacement);
      if (!match) {
        return replacement;
      }
      var code = match[2];
      code = transform(code, file);
      var codeMirror =
        '<textarea mode="javascript" class="spm-doc-textarea">' + match[2] + '</textarea>';
      return match[1] + code + match[3] + codeMirror;
    });


    // ````css ... ````
    re = /(<style class=\"nico-insert-code\">)([\s\S]*?)(<\/style>)/gi;
    re_match = /(<style class=\"nico-insert-code\">)([\s\S]*?)(<\/style>)/i;

    content = content.replace(re, function (replacement) {
      var match = re_match.exec(replacement);
      if (!match) {
        return replacement;
      }
      var codeMirror =
        '<textarea mode="css" class="spm-doc-textarea">' + match[2] + '</textarea>';
      return replacement + codeMirror;
    });

  }

  return content;
};

exports.transform = transform;

function transform(code, file) {
  // 转换 jsx 代码
  if (code.indexOf('/** @jsx React.DOM */') > -1) {
    code = ReactTools.transform(code);
  }

  // 依赖转换
  code = crequire(code, function(item) {
    return 'window[\'' + normalizeDep(item.path, file) + '\']';
  });

  return code;
}
