define(function(require, exports, module) {
  var tpl = '<div>hello</div><input name="nihai" value=\'{"name": "a"}\'/>';
  var config = require('../../core/js/config.js'); 
  var utils = require('../../core/js/utils.js'); 
  
  exports.say = function() {
    utils.log('tpl----->' + tpl);
    utils.log('config--->', config);
  };
});
