
var fs = require('fs');
var os = require('os');
var zlib = require('zlib');
var request = require('request');
var util = require('util');
var spmrc = require('spmrc');
var log = require('spm-log');
var pkg = require('../../package.json');

var userAgent = util.format(
  'spm (%s, %s, %s %s)',
  pkg.version, process.version, os.platform(), os.arch()
);

function Yuan(options) {
  options = options || {};

  this.server = options.registry || spmrc.get('registry') || 'http://spmjs.io';
  this.server = this.server.replace(/\/$/, '');
  options.proxy = options.proxy || spmrc.get('proxy');

  this.authKey = 'auth';
  this.options = options;
}

Yuan.prototype.request = function(data, callback) {
  callback = callback || function() {};

  data.url = util.format('%s/%s', this.server, data.urlpath);
  log.debug(data.method.toLowerCase(), data.url);

  data.headers = data.headers || {};

  if (data.auth) {
    data.headers['Authorization'] = 'Yuan ' + data.auth;
    delete data.auth;
  }
  var options = this.options;
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

  // use gzip
  if (data.json) {
    data.encoding = null;
    data.headers['accept-encoding'] = 'gzip';
  }

  var self = this;
  var req = request(data, function(err, res, body) {
    if (err) {
      if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
        log.error('request', err);
        log.error('yuan', data.url);
        process.exit(1);
      }
      callback(err);
      return;
    }
    if (data.json && res.headers['content-encoding'] === 'gzip') {
      zlib.gunzip(body, function(err, content) {
        if (err) {
          callback(err);
          return;
        }
        try {
          body = JSON.parse(content.toString());
        } catch(e) {
          log.error('yuan', 'parsing response error');
          log.debug('html', content);
          process.exit(2);
        }
        res.body = body;
        callback(err, res, body);
      });
    } else {
      callback(err, res, body);
    }
  });

  req.on('error', function(err) {
    log.error('error', err);
  });
  req.on('complete', function(res) {
    if (res.statusCode === 401) {
      log.error('fail', 'authorization is required. try `spm login`');
      spmrc.set(self.authKey, '');
      process.exit(1);
    }
  });
  return req;
};

Yuan.prototype.upload = function(data, callback) {
  if (data.private && this.server === 'http://spmjs.io') {
    log.error('yuan', 'this is a private repo');
    process.exit(3);
  }

  var auth = spmrc.get(this.authKey);
  var query = {
    urlpath: 'repository/upload/',
    method: 'POST',
    auth: auth
  };
  var self = this;
  var r = this.request(query, callback);

  var form = r.form();
  form.append('name', data.name || '');
  form.append('version', data.version || '');
  form.append('tag', data.tag || 'latest');
  form.append('file', fs.createReadStream(data.tarfile));
  form.getLength(function(err, len) {
    log.info('target', self.server);
    r.setHeader('Content-Length', len);
  });
};

exports = module.exports = function(options) {
  return new Yuan(options);
};

exports.Yuan = Yuan;
