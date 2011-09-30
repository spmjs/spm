seajs.config({
  base: 'http://a.tbcdn.cn/libs',
  timeout: 5000,
  alias: {
    'increment': 'increment.js?t=20110530',
    'lib': './lib',
    'underscore': 'underscore/1.1.6/underscore'
  },
  debug: true
});
