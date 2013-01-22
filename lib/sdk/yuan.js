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
      'X-YUAN-AUTH': options.auth
    };
  } else {
    data.headers = data.headers || {};
  }
  delete options.auth;

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
  request(data, function(error, response, body) {
    if (!error) {
      if (callback) {
        callback(null, response, body);
      } else {
        self.emit('data', body);
        self.emit('end');
      }
    } else {
      callback && callback(error);
    }
  });
  return self;
};

Yuan.prototype.login = function(callback) {
  var options = this.options;
  var account = options.account || options.username || options.email;
  options.account = account;
  var data = this._requestData(options);
  data.url = 'account/login', data.method = 'POST';
  return this.request(data, callback);
};

Yuan.prototype.publish = function(callback) {
  var options = this.options;
  var data = this._requestData(options);
  data.url = util.format('repository/%s/%s/%s', options.root, options.name, options.version);
  data.method = 'POST';

  var self = this;
  self.request(data, function(err, response, body) {
    if (response.statusCode < 300) {
      delete data.json;
      data.headers['content-type'] = 'application/x-tar-gz';
      data.headers['content-length'] = fs.statSync(options.tarfile).size;
      data.body = fs.readFileSync(options.tarfile);
      data.method = 'PUT';
      return self.request(data, 'PUT', callback);
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
