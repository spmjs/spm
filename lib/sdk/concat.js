var fs = require('fs-extra');
var path = require('path');
var _ = require('underscore');
var logging = require('colorful').logging;
var ast = require('./ast');


exports.concat = concat;


function concat(src, dest, rules, encoding) {
  encoding = encoding || 'utf8';
  // available rules:
  //
  // a.js: '.'
  // a.js: '*'
  // a.js: ['a.js', 'b.js', 'c.js']

  var data;
  _.each(rules, function(value, key) {
    if (/\.js$/.test(key)) {
      data = concatJS(src, key, value, encoding);
      fs.writeFileSync(path.join(dest, key), data);
    } else if (/\.css$/.test(key)) {
      // TODO
    }
  });
}


function concatJS(src, key, value, encoding) {
  if (value === '.') {
    return concatRelativeJS(src, key, encoding);
  } else if (value === '*') {
    return concatAllJS(src, key, encoding);
  } else {
    return concatRelativeJS(src, value, encoding);
  }
}

function concatRelativeJS(src, key, encoding) {
  var data = fs.readFileSync(path.join(src, key), encoding);
  var rv = ast.parseDefines(data);

  var deps = [], filepath;
  rv.forEach(function(r) {
    r.dependencies.forEach(function(dep) {
      if (dep.charAt(0) === '.' && !_.contains(deps, dep)) {
        data += readJSFileSync(path.join(src, dep), encoding);
        deps.push(dep);
      }
    });
  });
  return data;
}

function concatListJS(src, fnames, encoding) {
  if (_.isString(fnames)) {
    fnames = [fnames];
  }
  var data = '';
  fnames.forEach(function(fname) {
    data += readJSFileSync(path.join(src, fname), encoding);
  });
  return data;
}

function concatAllJS(src, key, encoding) {
  // TODO
  return '';
}

function readJSFileSync(fpath, encoding) {
  if (!/\.js$/.test(fpath)) {
    fpath += '.js';
  }
  if (!fs.existsSync(fpath)) {
    logging.warn(fpath, 'not exits');
    return '';
  }
  return '\n' + fs.readFileSync(fpath, encoding) + '\n';
}
