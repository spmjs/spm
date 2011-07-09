// vim: set tabstop=2 shiftwidth=2:

/**
 * @fileoverview SeaJS Package Manager Configuration.
 * @author yyfrankyy@gmail.com (Frank Xu)
 */


module.exports = {
  PLACEHOLDER: '/*{{code}}*/',
  MODULES_DIR: 'modules',
  TRANSPORTS_DIR: 'transports',
  DEFAULT_VERSION: '1.0.0',
  ENABLE_ACTIONS: [
    'transport',
    'remove',
    'install',
    'search',
    'build',
    'completion',
    'test',
    'help'
  ],
  ALIASES: {
    rm: 'remove'
  },
  SPMSERVER: 'http://modules.seajs.com/',
  REGISTRY: 'http://seajs.cloudfoundry.com/registry',
  SEARCH: 'http://seajs.cloudfoundry.com/search/'
};
