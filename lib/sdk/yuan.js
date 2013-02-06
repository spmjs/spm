/*
 * spm.sdk.yuan
 * communicate with yuan (https://github.com/lepture/yuan)
 *
 * Hsiaoming Yang <lepture@me.com>
 */

var fs = require('fs');
var stream = require('stream');
var crypto = require('crypto');
var request = require('request');
var util = require('util');
var _ = require('grunt').util._;
var log = require('../utils/log');
var pkg = require('../../package.json');

function Yuan(options) {
  this.options = options;
}

Yuan.prototype.request = function(data, callback) {
  log.debug(data.method.toLowerCase(), data.url);
  var req = request(data, callback);
  req.on('error', function(err) {
    log.error('error', err);
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
  options.url = util.format('repository/%s/%s/%s', options.family, options.name, options.version);

  var data = _requestData(options);
  data.method = 'POST';

  var s = new stream.Stream();
  s.readable = true;

  var self = this;
  request(data, function(err, res, body) {
    log.debug(data.method.toLowerCase(), data.url);
    if (err) {
      log.error('exit', err);
      process.exit(1);
    }
    if (res.statusCode >= 500) {
      log.error('exit', 'status code: ' + res.statusCode);
      process.exit(1);
    }
    if (body.status === 'success' || body.status === 'info') {
      delete data.json;
      data.headers['content-type'] = 'application/x-tar-gz';
      data.headers['content-length'] = fs.statSync(options.tarfile).size;
      data.body = fs.readFileSync(options.tarfile);
      var md5value = crypto.createHash('md5').update(data.body).digest('hex');
      data.headers['x-package-md5'] = md5value;
      log.debug('md5', md5value);
      data.method = 'PUT';

      self.request(data, callback).on('complete', function(res, body) {
        s.emit('data', body);
      }).on('response', function(res) {
        s.emit('response', res);
      }).on('end', function() {
        s.emit('end');
      });
    } else if (body.status === 'error') {
      log.error('exit', body.message);
      process.exit(1);
    } else {
      log[body.status](body.status, body.message);
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
    options.url = util.format('repository/%s/%s/%s', options.family, options.name, options.version);
  } else {
    options.url = util.format('repository/%s/%s/', options.family, options.name);
  }
  var data = _requestData(options);
  data.method = 'GET';

  var parseDownload = function(data) {
    var download, download_url, download_base;
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
      download = download_url;
    } else {
      download = util.format('%s/%s', download_base.replace(/\/$/, ''), download_url);
    }
    return {
      download_base: download_base,
      download_url: download_url,
      download: download
    };
  };

  var s = new stream.Stream();
  s.readable = true;

  this.request(data, function(err, res, body) {
    if (err) {
      callback && callback(err);
    } else if (res.statusCode >= 400) {
      callback && callback(body.message);
    } else {
      _.extend(body.data, parseDownload(body.data));
      var latest = (body.data.packages && body.data.packages[0]) || {};
      body.data.md5 = body.data.md5 || latest.md5;
      body.data.version = body.data.version || latest.version;
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
