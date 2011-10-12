// vim: set tabstop=2 shiftwidth=2:

/**
 * @fileoverview SeaJS Package Manager Configuration.
 * @author yyfrankyy@gmail.com (Frank Xu)
 */


module.exports = {
  VERSION: '0.3.0',
  MESSAGE: require('./i18n/en-us'),

  AVAILABLE_ACTIONS: [
    'build',
    'transport',
    'install',
    //'remove',
    'help',
    'completion'
  ],

  SPM_SERVER: 'http://modules.seajs.com/',
  MODULES_REGISTRY: 'http://modules.seajs.com/registry.json',
  SEARCH: 'http://sea.no.de/search'
};
