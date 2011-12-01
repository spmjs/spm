define(function(require) {

  var lang = this.LANG = 'zh-cn';

  if (LANG === 'zh-cn') {
    lang = require('./zh-cn.js');
  }
  else if (LANG === 'en-us') {
    lang = require('./en-us.js');
  }

});
