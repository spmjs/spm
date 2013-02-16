/*
 * spm.sdk.yuan
 * communicate with yuan (https://github.com/lepture/yuan)
 *
 * Hsiaoming Yang <lepture@me.com>
 */

var fs = require('fs');
var os = require('os');
var crypto = require('crypto');
var request = require('request');
var util = require('util');
var _ = require('grunt').util._;
var spmrc = require('./spmrc');
var log = require('../utils/log');
var pkg = require('../../package.json');

var userAgent = util.format(
  'spm (%s, %s, %s %s)',
  pkg.version, process.version, os.platform(), os.arch()
);


function Yuan(options) {
  var account = options.account || options.username || options.email;
  if (account) options.account = account;

  var key = options.source ? 'source.' + options.source + '.url' : 'user.source';
  options.server = (spmrc.get(key) || 'https://spmjs.org').replace(/\/$/, '');

  this.options = options;
}

Yuan.prototype.request = function(data, callback) {
  log.debug(data.method.toLowerCase(), data.url);

  var req = request(data, callback);
  var source = this.options.source;

  req.on('error', function(err) {
    log.error('error', err);
  });
  req.on('complete', function(res, body) {
    if (res.statusCode === 401) {
      log.error('authorization', body.data.message);
      console.log();
      // clean auth token
      var key = source ? 'source.' + source + '.auth' : 'user.auth';
      spmrc.set(key, '');
      process.exit(1);
    }
  });
  return req;
};

Yuan.prototype.login = function(callback) {
  var options = this.options;
  var key = options.source ? 'source.' + options.source + '.auth' : 'user.auth';
  var auth = spmrc.get(key);
  if (auth) {
    callback(null, {body: {data: auth}}, {data: auth});
    return;
  }
  if (!(typeof options.password === 'string' && options.account)) {
    callback(null, {body: {data: null}}, {data: null});
    return;
  }
  options.url = 'account/login';
  var data = _requestData(options);

  data.json = {account: options.account, password: options.password};
  data.method = 'POST';
  this.request(data, function(err, res, body) {
    if (err) {
      callback(err);
      return;
    }
    if (res.statusCode === 200 && body.data) {
      spmrc.set(key, body.data);
    }
    callback(err, res, body);
  });
};

Yuan.prototype.publish = function(callback) {
  var options = this.options;
  options.url = util.format('repository/%s/%s/%s', options.family, options.name, options.version);

  var data = _requestData(options);
  data.method = 'POST';
  data.json = {
    'homepage': options.homepage,
    'repository': options.repository,
    'description': options.description,
    'tag': options.tag || 'stable',
    'readme': options.readme || '',
    'dependencies': options.dependencies || []
  };
  if (options.download_url) {
    data.json.download_url = options.download_url;
  }
  if (options.private) {
    data.json.private = true;
  }

  var self = this;
  request(data, function(err, res, body) {
    log.debug(data.method.toLowerCase(), data.url);
    if (err) {
      log.error('exit', err);
      process.exit(1);
    }
    if (res.statusCode === 401) {
      log.error('authorization', body.data.message);
      console.log();
      // clean auth token
      var key = options.source ? 'source.' + options.source + '.auth' : 'user.auth';
      spmrc.set(key, '');
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
      self.request(data, callback);
    } else if (body.status === 'error') {
      log.error('exit', body.message);
      process.exit(1);
    } else {
      log[body.status](body.status, body.message);
      // callback error
      callback && callback(body.message);
    }
  });
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
  data.json = true;

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

  this.request(data, function(err, res, body) {
    if (err) {
      callback && callback(err);
    } else if (res.statusCode !== 200) {
      callback && callback(null, res, body);
    } else {
      _.extend(body.data, parseDownload(body.data));
      var latest = (body.data.packages && body.data.packages[0]) || {};
      body.data.md5 = body.data.md5 || latest.md5;
      body.data.version = body.data.version || latest.version;
      callback && callback(null, res, body);
    }
  });
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
  if (options.force) {
    data.headers['X-Yuan-Force'] = 'true';
  }
  data.headers['user-agent'] = userAgent;

  if (options.lang) {
    data.headers['Accept-Language'] = options.lang;
  } else {
    data.headers['Accept-Language'] = process.env.LANG || 'en_US';
  }
  if (options.proxy) {
    data.proxy = options.proxy;
  }
  return data;
}
