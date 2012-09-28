define("#public/core/js/config-debug", [], {
  name: 'config',
  version: '1.0'
});


define("#public/core/js/utils-debug", [], function(require, exports) {
    exports.log = function(str) {
        console.info('[log] ' + str);
    };
});


define("#public/contact/model/m-debug", ["../../core/js/config-debug", "../../core/js/utils-debug"], function(require, exports, module) {
  var tpl = '<div>hello</div><input name="nihai" value=\'{"name": "a"}\'/>';
  var config = require('../../core/js/config-debug'); 
  var utils = require('../../core/js/utils-debug'); 
  
  exports.say = function() {
    utils.log('tpl----->' + tpl);
    utils.log('config--->', config);
  };
});


define("#public/main-debug", ["./core/js/config-debug", "./core/js/utils-debug", "./contact/model/m-debug", "$-debug", "base-debug"], function(require, exports, module) {
  var m = require('./contact/model/m-debug');
  var $ = require('$-debug');
  var base = require('base-debug');

  exports.say = function(id) {
    m.say();
    console.info($(id));
    console.info(base);
  };
});
