/*
 * spm.sdk.iduri
 * https://spmjs.org
 *
 * Hsiaoming Yang <me@lepture.com>
 */

var iduri = require('cmd-util').iduri;
var log = require('../utils/log');

exports = module.exports = iduri;

// if id is valid.
// options: {strict: false}
exports.validate = function(id, options) {
  options = options || {};
  if (~id.indexOf('//')) {
    log.error('validate', 'invalid id: ' + id);
    return false;
  }
  var regex = /^(?:[a-z][a-z0-9\-]*\/)?[a-z][a-z0-9\-]*\/\d+\.\d+\.\d+\/[a-z0-9\-\/]+$/;
  if (regex.test(id)) {
    return true;
  }
  if (options.strict) {
    log.error('validate', 'invalid CMD id: ' + id);
  } else {
    log.warn('validate', 'invalid CMD id: ' + id);
  }
  return false;
};
