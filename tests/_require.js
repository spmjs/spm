var logging = require('colorful').logging;
logging.level = 'silent';

module.exports = function(file) {
  if (process.env.SPM_COVERAGE) {
    file = file.replace('/lib/', '/lib-cov/');
  }
  return require(file);
};
