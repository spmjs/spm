/*
 * communicate with yuan (https://github.com/lepture/yuan)
 *
 * @author: Hsiaoming Yang <lepture@me.com>
 *
 * @lastChangedBy: Hsiaoming Yang <lepture@me.com>
 */

var Stream = require('stream');
var format = require('util').format;
var request = require('request');


function getAuthToken(options, callback) {
  var s = new Stream();
  s.readable = true;

  var data = formatRequestData('/account/login', options);
  request.post(data, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      s.emit('data', body.data.auth);
      callback && callback(null, body.data.auth);
    } else {
      callback && callback(error);
    }
  });
  return s;
}


function registerProject(options, callback) {
  var urlpath = format('/repository/%s/%s', options.root, options.name);
  var data = formatRequestData(urlpath, options);
  request.post(data, function(error, response, body) {
    if (error) {
      return callback(error);
    }
    callback(null, body);
  });
}

function registerPackage(options, callback) {
  var urlpath = format('/repository/%s/%s/%s', options.root, options.name, options.version);
  var data = formatRequestData(urlpath, options);
  request.post(data, function(error, response, body) {
    if (error) {
      return callback(error);
    }
    callback(null, body);
  });
}


function publishPackage(options, callback) {
  var urlpath = format('/repository/%s/%s/%s', options.root, options.name, options.version);
  var distfile = options.distfile;
  var data = formatRequestData(urlpath, options);
  delete data.json;
}


// helpers

function formatRequestData(urlpath, options) {
  var server = (options.server || 'https://spmjs.org').replace(/\/$/, '');
  delete options.server;

  var data = {url: server + urlpath};
  if (options.authToken) {
    data.headers = {
      'X-YUAN-AUTH': options.authToken
    };
  }
  delete options.authToken;

  if (options.proxy) {
    data.proxy = options.proxy;
  }
  delete options.proxy;
  data.json = options;
  return data;
}
