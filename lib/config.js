// vim: set tabstop=2 shiftwidth=2:

/**
 * @fileoverview SeaJS Package Manager Configuration.
 * @author yyfrankyy@gmail.com (Frank Xu)
 */


module.exports = {
  lang: 'en-us',

  AVAILABLE_ACTIONS: [
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

  TRANSPORTS_DIR: 'transports',
  PLACEHOLDER: '/*{{code}}*/',
  MODULE_DEFAULT_VERSION: '1.0.0',
  MODULES_DIR: 'modules',

  SPM_SERVER: 'http://modules.seajs.com/',
  REGISTRY: 'http://sea.no.de/registry',
  SEARCH: 'http://sea.no.de/search'
};
