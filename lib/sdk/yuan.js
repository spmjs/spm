/*
 * communicate with yuan (https://github.com/lepture/yuan)
 *
 * @author: Hsiaoming Yang <lepture@me.com>
 *
 * @lastChangedBy: Hsiaoming Yang <lepture@me.com>
 */

var fs = require('fs');
var request = require('request');
var stream = require('stream');
var util = require('util');
var logging = require('colorful').logging;

function Yuan(options) {
  stream.Stream.call(this);
  this.readable = true;
  this.writable = true;
  this.options = options;
}
util.inherits(Yuan, stream.Stream);

Yuan.prototype._requestData = function(options) {
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

  // TODO md5 value of tarfile
  return data;
};

Yuan.prototype.request = function(data, callback) {
  var self = this;
  logging.info(data.method, data.url);
  request(data, function(error, response, body) {
    if (!error) {
      if (body.message) {
        logging[body.status](body.message);
      }
      self.emit('data', body);
      self.emit('response', response);
      callback && callback(null, response, body);
    } else {
      logging.error(error);
      self.emit('error', error);
      callback && callback(error);
    }
    self.emit('end');
  });
  return self;
};

Yuan.prototype.login = function(callback) {
  var options = this.options;
  var account = options.account || options.username || options.email;
  options.account = account;
  options.url = 'account/login';
  var data = this._requestData(options);
  data.method = 'POST';
  return this.request(data, callback);
};

Yuan.prototype.publish = function(callback) {
  var options = this.options;
  options.url = util.format('repository/%s/%s/%s', options.root, options.name, options.version);
  var data = this._requestData(options);
  data.method = 'POST';

  var self = this;
  request(data, function(error, response, body) {
    if (error) {
      logging.error(error);
      process.exit(1);
      return;
    }
    if (body.status === 'success' || body.status === 'info') {
      delete data.json;
      data.headers['content-type'] = 'application/x-tar-gz';
      data.headers['content-length'] = fs.statSync(options.tarfile).size;
      data.body = fs.readFileSync(options.tarfile);
      data.method = 'PUT';
      self.request(data, callback);
    } else if (body.status === 'error') {
      logging.error(body.message);
      process.exit(1);
    } else {
      logging[body.status](body.message);
      callback(body.message);
    }
  });
  return self;
};

exports = module.exports = function(options) {
  return new Yuan(options);
};

exports.Yuan = Yuan;

exports.login = function(options, callback) {
};

exports.publish = function(options, callback) {
};
