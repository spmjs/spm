var log = require('..').log;
log.quiet = true;

module.exports = function(file) {
  if (process.env.SPM_COVERAGE) {
    file = file.replace('/lib/', '/lib-cov/');
  }
  return require(file);
};
