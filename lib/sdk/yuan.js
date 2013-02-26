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
var semver = require('semver');
var _ = require('grunt').util._;
var spmrc = require('./spmrc');
var log = require('../utils/log');
var pkg = require('../../package.json');

var userAgent = util.format(
  'spm (%s, %s, %s %s)',
  pkg.version, process.version, os.platform(), os.arch()
);


function Yuan(options) {
  options = options || {};

  if (options.source) {
    this.server = spmrc.get('source.' + options.source + '.url');
    this.authKey = 'source.' + options.source + '.auth';
  } else {
    this.server = spmrc.get('user.source');
    this.authKey = 'user.auth';
  }

  this.server = (this.server || 'https://spmjs.org').replace(/\/$/, '');
  this.options = options;
}

Yuan.prototype.request = function(data, callback) {
  log.debug(data.method.toLowerCase(), data.urlpath);

  data.url = util.format('%s/%s', this.server, data.urlpath);
  data.headers = data.headers || {};

  if (data.auth) {
    data.headers['Authorization'] = 'Yuan ' + data.auth;
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

  var self = this;
  var req = request(data, callback);
  req.on('error', function(err) {
    log.error('error', err);
  });
  req.on('complete', function(res, body) {
    if (res.statusCode === 401) {
      log.error('authorization', body.data.message);
      console.log();
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
  var auth = spmrc.get(this.authKey);
  if (!auth) {
    callback('login is required.');
    return;
  }
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
      log.error('exit', err);
      process.exit(1);
    }
    if (res.statusCode >= 500) {
      log.error('exit', 'status code: ' + res.statusCode);
      process.exit(1);
    }
    if (res.statusCode === 401) {
      spmrc.set(self.authKey, '');
    }
    if (body.message) {
      log[body.status]('exit', body.message);
      process.exit();
    } else {
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
    }
  });
};

Yuan.prototype.unpublish = function(pkg, callback) {
  var auth = spmrc.get(this.authKey);
  if (!auth) {
    callback('login is required.');
    return;
  }
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
  if (data.version) {
    data.urlpath = util.format(
      'repository/%s/%s/%s/', data.family, data.name, data.version
    );
  } else {
    data.urlpath = util.format(
      'repository/%s/%s/', data.family, data.name
    );
  }
  data.method = 'GET';
  data.json = true;

  this.request(data, function(err, res, body) {
    if (err) {
      callback && callback(err);
    } else if (res.statusCode !== 200) {
      callback && callback(body.message);
    } else {
      if (body.versions) {
        body.versions = sort(body.versions);
        var latest = Object.keys(body.versions)[0];
        if (latest) {
          // ensure not extends versions
          delete latest.versions;
          body = _.extend(body, body.versions[latest]);
        }
      }
      callback && callback(null, res, body);
    }
  });
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

exports = module.exports = function(options) {
  return new Yuan(options);
};
exports.Yuan = Yuan;


function sort(versions) {
  var vers = Object.keys(versions).sort(function(a, b) {
    return semver.compare(b, a);
  });
  var ret = {};
  vers.forEach(function(v) {
    var pkg = versions[v];
    if (pkg.filename) {
      ret[v] = pkg;
    }
  });
  return ret;
}
