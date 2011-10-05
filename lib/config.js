// vim: set tabstop=2 shiftwidth=2:

/**
 * @fileoverview SeaJS Package Manager Configuration.
 * @author yyfrankyy@gmail.com (Frank Xu)
 */


module.exports = {
  MESSAGE: require('./i18n/en-us'),

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

  TRANSPORTS_DIR: 'transports',
  PLACEHOLDER: '/*{{code}}*/',
  MODULE_DEFAULT_VERSION: '1.0.0',
  MODULES_DIR: 'modules',

  SPM_SERVER: 'http://modules.seajs.com/',
  REGISTRY: 'http://sea.no.de/registry',
  SEARCH: 'http://sea.no.de/search'
};
