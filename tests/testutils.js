var logging = require('../lib/utils').logging;
logging.config('error');

module.exports = function(file) {
  if (process.env.SPM_COVERAGE) {
    file = file.replace('/lib/', '/lib-cov/');
  }
  return require(file);
};
