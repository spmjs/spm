/*
 * spm.sdk.yuan
 * communicate with yuan (https://github.com/lepture/yuan)
 *
 * Hsiaoming Yang <me@lepture.com>
 */

var fs = require('fs');
var os = require('os');
var zlib = require('zlib');
var crypto = require('crypto');
var request = require('request');
var FormData = require('form-data');
var util = require('util');
var semver = require('semver');
var _ = require('lodash');
var spmrc = require('spmrc');
var log = require('../utils/log');
var pkg = require('../../package.json');

var userAgent = util.format(
  'spm (%s, %s, %s %s)',
  pkg.version, process.version, os.platform(), os.arch()
);


function Yuan(options) {
  options = options || {};

  var source = options.source || 'default';

  this.server = spmrc.get('source.' + source + '.url');
  this.mirror = spmrc.get('source.' + source + '.mirror');
  options.proxy = options.proxy || spmrc.get('source.' + source + '.proxy');

  this.server = (this.server || 'https://spmjs.org').replace(/\/$/, '');
  this.mirror = (this.mirror || this.server).replace(/\/$/, '');
  this.mirror = this.mirror.replace(
    /^https\:\/\/spmjs\.org/, 'http://spmjs.org'
  );

  this.authKey = 'source.' + source + '.auth';
  this.options = options;
}

Yuan.prototype.request = function(data, callback) {
  data.url = util.format('%s/%s', this.server, data.urlpath);
  if (data.method.toLowerCase() === 'get' && data.urlpath.indexOf('repository/search') !== 0) {
    // mirror is faster
    data.url = util.format('%s/%s', this.mirror, data.urlpath);
  }
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
        log.error('request', data.url);
        process.exit(1);
      }
      callback(err);
      return;
    }
    if (res.statusCode === 404) {
      callback('not found');
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

Yuan.prototype.login = function(data, callback) {
  if (!(data.password && data.username)) {
    callback('Missing parameters.');
    return;
  }
  var req = {
    json: {account: data.username, password: data.password},
    method: 'POST',
    urlpath: 'account/login'
  };
  var self = this;
  this.request(req, function(err, res, body) {
    if (err) {
      callback(err);
      return;
    }
    if (res.statusCode === 200 && body.data) {
      spmrc.set(self.authKey, body.data);
      callback(null, body.data);
    } else if (body.message) {
      callback(body.message);
    } else {
      callback(null);
    }
  });
};

Yuan.prototype.register = function(data, callback) {
  if (!(data.password && data.username && data.email)) {
    callback('Missing parameters.');
    return;
  }
  var req = {
    json: {name: data.username, email: data.email, password: data.password},
    method: 'POST',
    urlpath: 'account/register'
  };
  var self = this;
  this.request(req, function(err, res, body) {
    if (err) {
      callback(err);
      return;
    }
    if (res.statusCode === 200 && body.data) {
      spmrc.set(self.authKey, body.data);
      callback(null, body.data);
    } else if (body.message) {
      callback(body.message);
    } else {
      callback(null);
    }
  });
};

Yuan.prototype.publish = function(pkg, callback) {
  if (pkg.private && this.server === 'https://spmjs.org') {
    log.error('yuan', 'this is a private repo');
    process.exit(3);
  }
  var auth = spmrc.get(this.authKey);
  var req = {};
  req.urlpath = util.format(
    'repository/%s/%s/%s/', pkg.family, pkg.name, pkg.version
  );
  req.method = 'POST';
  req.auth = auth;
  req.json = pkg;

  var self = this;
  this.request(req, function(err, res, body) {
    if (err) {
      log.error('yuan', err);
      process.exit(1);
    }
    if (res.statusCode >= 500) {
      log.error('yuan', 'status code: ' + res.statusCode);
      process.exit(1);
    }
    if (res.statusCode === 401) {
      spmrc.set(self.authKey, '');
    }
    if (body && body.message && body.status) {
      log[body.status]('yuan', body.message);
      if (res.statusCode === 401) {
        log.error('yuan', '`spm login` first');
      }
      process.exit();
    } else if (self.options.tarfile) {
      var data = {};
      data.auth = auth;
      var tarfile = self.options.tarfile;
      data.body = fs.readFileSync(tarfile);
      var md5value = crypto.createHash('md5').update(data.body).digest('hex');
      data.headers = {
        'content-type': 'application/x-tar',
        'content-encoding': 'gzip',
        'content-length': fs.statSync(tarfile).size,
        'x-package-md5': md5value
      };
      data.method = 'PUT';
      data.urlpath = req.urlpath;
      self.request(data, callback);
    } else {
      callback(err, res, body);
    }
  });
};

Yuan.prototype.unpublish = function(pkg, callback) {
  var auth = spmrc.get(this.authKey);
  var req = {};
  req.urlpath = util.format('repository/%s/%s/', pkg.family, pkg.name);
  if (pkg.version) {
    req.urlpath += pkg.version + '/';
  }
  req.method = 'DELETE';
  req.json = true;
  req.auth = auth;
  this.request(req, callback);
};

Yuan.prototype.info = function(data, callback) {
  if (data.version && data.version.indexOf('.') === -1) {
    data.tag = data.version;
    delete data.version;
  }
  if (data.version) {
    data.urlpath = util.format(
      'repository/%s/%s/%s/', data.family, data.name, data.version
    );
  } else if (data.name) {
    data.urlpath = util.format(
      'repository/%s/%s/', data.family, data.name
    );
  } else {
    data.urlpath = util.format(
      'repository/%s/', data.family
    );
  }
  data.method = 'GET';
  data.json = true;
  var self = this;

  this.request(data, function(err, res, body) {
    if (err) {
      callback && callback(err);
    } else if (res.statusCode !== 200) {
      callback && callback(body.message);
    } else {
      if (data.name) {
        body = self.extend(body, data.tag);
      }
      if (!body && data.tag) {
        callback && callback('not found on ~ ' + data.tag);
        return;
      }
      callback && callback(null, res, body);
    }
  });
};
Yuan.prototype.extend = function(item, tag) {
  if (item.packages && tag) {
    var versions = Object.keys(item.packages);
    versions = versions.filter(function(v) {
      return item.packages[v].tag === tag;
    });
    if (!versions.length) {
      return null;
    }
    versions.sort(function(a, b) {
      return semver.compare(b, a);
    });
    item = _.extend(item, item.packages[versions[0]]);
    item.versions = versions;
    return item;
  }
  if (item.packages) {
    item.versions = Object.keys(item.packages).sort(function(a, b) {
      return semver.compare(b, a);
    });
    if (item.packages[item.version]) {
      item = _.extend(item, item.packages[item.version]);
    } else {
      item = _.extend(item, item.packages[item.versions[0]]);
    }
    return item;
  }
  return item;
};

Yuan.prototype.search = function(data, callback) {
  data.urlpath = util.format('repository/search?q=%s', data.query);
  data.method = 'GET';
  data.json = true;
  this.request(data, function(err, res, body) {
    if (err) {
      callback && callback(err);
    } else if (res.statusCode !== 200) {
      callback && callback('status code ' + res.statusCode);
    } else {
      callback && callback(err, res, body);
    }
  });
};

Yuan.prototype.upload = function(data, callback) {
  if (pkg.private && this.server === 'https://spmjs.org') {
    log.error('yuan', 'this is a private repo');
    process.exit(3);
  }

  var auth = spmrc.get(this.authKey);
  var query = {
    urlpath: 'repository/upload/' + data.family,
    method: 'POST',
    auth: auth
  };
  var self = this;
  var form = new FormData();
  form.append('name', data.name || '');
  form.append('version', data.version || '');
  form.append('tag', data.tag || 'latest');
  form.append('file', fs.createReadStream(data.tarfile));
  form.getLength(function(err, len) {
    var r = self.request(query, callback);
    r._form = form;
    r.setHeader('Content-Length', len);
  });
};

exports = module.exports = function(options) {
  return new Yuan(options);
};
exports.Yuan = Yuan;
