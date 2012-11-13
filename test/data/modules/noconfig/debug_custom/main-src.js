define("#public/1.0.0/contact/model/m-src", ["../../core/js/config-src", "../../core/js/utils-src"], function(require, exports, module) {
  var tpl = '<div>hello</div> <input name="nihai" value=\'{"name": "a"}\'/>';
  var config = require('../../core/js/config-src'); 
  var utils = require('../../core/js/utils-src'); 
  
  exports.say = function() {
    utils.log('tpl----->' + tpl);
    utils.log('config--->', config);
  };
});

define("#public/1.0.0/core/js/config-src", [], {
  name: 'config',
  version: '1.0'
});

define("#public/1.0.0/core/js/utils-src", [], function(require, exports) {
    exports.log = function(str) {
        console.info('[log] ' + str);
    };
});

define("#public/1.0.0/main-src", ["./contact/model/m-src", "./core/js/config-src", "./core/js/utils-src", "#jquery/1.7.2/jquery-src", "#base/1.0.0/base-src", "#class/1.0.0/class-src", "#events/1.0.0/events-src"], function(require, exports, module) {
  var m = require('./contact/model/m-src');
  var $ = require('#jquery/1.7.2/jquery-src');
  var base = require('#base/1.0.0/base-src');

  exports.say = function(id) {
    m.say();
    console.info($(id));
    console.info(base);
  };
});
