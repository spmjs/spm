// vim: set tabstop=2 shiftwidth=2:

/**
 * @fileoverview SeaJS Package Manager Configuration.
 * @author yyfrankyy@gmail.com (Frank Xu)
 */


module.exports = {
  PLACEHOLDER: '/*{{code}}*/',

  MODULES_DIR: 'modules',
  TRANSPORTS_DIR: 'transports',
  DEFAULT_BUILD_DIR: '__build',

  DEFAULT_VERSION: '1.0.0',

  ENABLE_ACTIONS: [
    //'transport',
    //'remove',
    'install',
    'search',
    'build',
    'completion',
    //'test',
    'help'
  ],

  ALIASES: {
    rm: 'remove'
  },

  SPM_SERVER: 'http://modules.seajs.com/',
  REGISTRY: 'http://sea.no.de/registry',
  SEARCH: 'http://sea.no.de/search'
};
