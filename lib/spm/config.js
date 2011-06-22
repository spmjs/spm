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
    'completion',
    'test',
    'help'
  ],
  ALIASES: {
    rm: 'remove'
  }
};
