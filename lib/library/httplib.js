/*
 * Plugin System
 * @author: Hsiaoming Yang <lepture@me.com>
 *
 * @lastChangedBy: Hsiaoming Yang <lepture@me.com>
 */

var util = require('util');


exports.resolve = function(uri) {
  // resolve uri to meta info
  //
  // first exclude git@ condition
  var bits, url, version;
  if (uri.indexOf('git@') === 0) {
    bits = uri.split('@');
    if (bits.length > 3) {
      throw 'invalid uri';
    }
    version = bits[2] || null;
    url = bits.slice(0, 2).join('@');
    return {type: 'git', url: url, version: version};
  }

  // get version
  bits = uri.split('@');
  if (bits.length > 2) {
    throw 'invalid uri';
  }
  version = bits[1] || null;
  uri = bits.shift();

  if (uri.slice(-4) === '.git') {
    return {type: 'git', url: uri, version: version};
  }

  if (uri.indexOf('http://') === 0 || uri.indexOf('https://') === 0) {
    return {type: 'http', url: uri, version: version};
  }

  // for uri like name/repo, it's github
  if (uri.split('/').length === 2) {
    url = util.format('git@github.com:%s', uri);
    return {type: 'git', url: url, version: version};
  }

  if (uri.split('.').length > 2) {
    throw 'invalid uri';
  }
  return {type: 'spm', url: uri, version: version};
};

exports.download = function(uri, callback) {
  var meta = exports.resolve(uri);
  if (meta.type === 'http') {
    httpFetch(meta, callback);
  } else if (meta.type === 'git') {
    gitFetch(meta, callback);
  } else if (meta.type === 'spm') {
    spmFetch(meta, callback);
  }
};

function httpFetch(meta, callback) {
}

function gitFetch(meta, callback) {
}

function spmFetch(meta, callback) {
}
