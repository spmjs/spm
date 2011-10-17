// vim: set tabstop=2 shiftwidth=2:

/**
 * @fileoverview SeaJS Package Manager Configuration.
 * @author yyfrankyy@gmail.com (Frank Xu)
 */


module.exports = {
  VERSION: '0.3.0',

  AVAILABLE_ACTIONS: [
    'build',
    'install',
    //'remove',
    'transport',
    'help',
    'completion'
  ],

  MODULES_SERVER: 'http://modules.seajs.com/',
  MODULES_REGISTRY: 'http://modules.seajs.com/registry.json'
};
