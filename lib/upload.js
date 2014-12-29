var fs = require('fs');
var path = require('path');
var format = require('util').format;
var tar = require('./utils/tar');
var log = require('spm-log');
var readJSON = require('fs-extra').readJSONSync;
var yuan = require('./sdk/yuan');
var spmrc = require('spmrc');

module.exports = function upload(options) {
  var doc = options.doc || '_site';
  log.info('upload', doc);
  var pkg = readJSON('package.json');
  _createTar(doc, pkg, function(err, target) {
    pkg.tarfile = target;
    pkg.tag = options.tag;
    yuan(options).upload(pkg, function(err, res, body) {
      if (err) {
        log.error('exit', err);
        process.exit(1);
      }
      if (res.statusCode >= 400) {
        log.error('exit', res.statusCode);
      }
      if (typeof body === 'string') {
        body = JSON.parse(body);
      }
      if (body.message && body.status) {
        log[body.status](body.status, body.message);
      }
      console.log();
    });
  }, true);
};

function _createTar(directory, data, callback, noIgnore) {
  var name = format('%s-%s.tar.gz', data.name, data.version || '');
  var tmp = spmrc.get('user.temp');
  var tarfile = path.join(tmp, name);
  tar.create(directory, tarfile, function(error, target) {
    var size = fs.statSync(target).size;
    log.info('tarfile', name + ' - ' + ((size/1024).toFixed(2) + 'KB').to.magenta);
    // 2 MB
    if (size > 2079152) {
      log.warn('size', 'package is a little big, maybe you need a .spmignore');
    }
    if (error) {
      log.error('exit', error);
      process.exit(1);
    }
    log.debug('tarfile', target);
    callback(null, target);
  }, noIgnore);
}
