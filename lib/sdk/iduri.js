/*
 * spm.sdk.iduri
 * https://spmjs.org
 *
 * Hsiaoming Yang <lepture@me.com>
 */

var iduri = require('cmd-util').iduri;
var logging = require('colorful').logging;

exports = module.exports = iduri;

// if id is valid.
// options: {strict: false}
exports.validate = function(id, options) {
  options = options || {};
  if (~id.indexOf('//')) {
    logging.error('Invalid id:', id);
    return false;
  }
  var regex = /^(?:[a-z][a-z0-9\-]*\/)?[a-z][a-z0-9\-]*\/\d+\.\d+\.\d+\/[a-z0-9\-\/]+$/;
  if (regex.test(id)) {
    return true;
  }
  if (options.hasOwnProperty('strict') && options.strict) {
    logging.error('Invalid CMD id:', id);
  } else {
    logging.warn('Invalid CMD id:', id);
  }
  return false;
};
