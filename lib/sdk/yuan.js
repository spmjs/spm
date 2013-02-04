/*
 * spm.sdk.yuan
 * communicate with yuan (https://github.com/lepture/yuan)
 *
 * Hsiaoming Yang <lepture@me.com>
 */

var fs = require('fs');
var request = require('request');
var stream = require('stream');
var util = require('util');
var _ = require('lodash');
var logging = require('colorful').logging;
var md5file = require('../utils').md5file;
var pkg = require('../../package.json');

function Yuan(options) {
  this.options = options;
}

Yuan.prototype.request = function(data, callback) {
  logging.info(data.method, data.url);
  var req = request(data, callback);
  req.on('error', function(err) {
    logging.error(err);
  });
  req.on('complete', function(response, body) {
    if (body.message) {
        logging[body.status](body.message);
    }
  });
  return req;
};

Yuan.prototype.login = function(callback) {
  var options = this.options;
  options.account = options.account || options.username || options.email;
  options.url = 'account/login';
  var data = _requestData(options);
  data.method = 'POST';
  return this.request(data, callback);
};

Yuan.prototype.publish = function(callback) {
  var options = this.options;
  options.url = util.format('repository/%s/%s/%s', options.root, options.name, options.version);

  var data = _requestData(options);
  data.method = 'POST';
  if (options.tarfile) {
    data.json.md5 = md5file(options.tarfile);
  }

  var s = new stream.Stream();
  s.readable = true;

  var self = this;
  request(data, function(error, response, body) {
    if (error) {
      logging.exit(error);
    }
    if (body.status === 'success' || body.status === 'info') {
      delete data.json;
      data.headers['content-type'] = 'application/x-tar-gz';
      data.headers['content-length'] = fs.statSync(options.tarfile).size;
      data.body = fs.readFileSync(options.tarfile);
      data.method = 'PUT';

      self.request(data, callback).on('complete', function(response, body) {
        s.emit('data', body);
      }).on('error', function(error) {
        s.emit('error', error);
      }).on('response', function(response) {
        s.emit('response', response);
      }).on('end', function() {
        s.emit('end');
      });
    } else if (body.status === 'error') {
      logging.exit(body.message);
    } else {
      logging[body.status](body.message);
      s.emit('data', body);
      s.emit('end');
      callback && callback(body);
    }
  });

  return s;
};

Yuan.prototype.info = function(callback) {
  var options = this.options;
  if (options.version) {
    options.url = util.format('repository/%s/%s/%s', options.root, options.name, options.version);
  } else {
    options.url = util.format('repository/%s/%s/', options.root, options.name);
  }
  var data = _requestData(options);
  data.method = 'GET';

  var parseDownload = function(data) {
    var download_url, download_base;
    if (options.version) {
      download_url = data.download_url;
    } else {
      download_url = data.packages[0].download_url;
    }
    if (options.download_base) {
      download_base = options.download_base;
    } else {
      download_base = data.download_base;
    }
    if (/^https?:/.test(download_url)) {
      return download_url;
    }
    var download = util.format('%s/%s', download_base.replace(/\/$/, ''), download_url);
    return {download_base: download_base, download_url: download_url, download: download};
  };

  var s = new stream.Stream();

  this.request(data, function(error, response, body) {
    if (error) {
      logging.error(error);
      s.emit('error', error);
      callback && callback(error);
    } else if (response.statusCode >= 400) {
      logging.error(body.message);
      s.emit('error', body.message);
      callback && callback(body.message);
    } else {
      _.extend(body.data, parseDownload(body.data));
      s.emit('data', body);
      callback && callback(null, body);
    }
  }).on('end', function() {
    s.emit('end');
  });
  return s;
};

exports = module.exports = function(options) {
  return new Yuan(options);
};
exports.Yuan = Yuan;

function _requestData(options) {
  var data = {};
  var server = (options.server || 'https://spmjs.org').replace(/\/$/, '');
  data.url = util.format('%s/%s', server, options.url);

  if (options.auth) {
    data.headers = {
      'Authorization': 'Yuan ' + options.auth
    };
  } else {
    data.headers = data.headers || {};
  }
  delete options.auth;
  if (options.force) {
    data.headers['X-Yuan-Force'] = 'true';
  }
  delete options.force;
  data.headers['user-agent'] = 'spm ' + pkg.version;

  if (options.lang) {
    data.headers['Accept-Language'] = options.lang;
  } else {
    data.headers['Accept-Language'] = process.env.LANG || 'en_US';
  }
  delete options.lang;

  if (options.proxy) {
    data.proxy = options.proxy;
  }
  delete options.proxy;

  data.json = options;

  return data;
}
