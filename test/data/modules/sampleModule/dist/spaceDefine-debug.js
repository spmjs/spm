define("sampleModule/0.0.1/spaceDefine-debug", [], function (require, exports) {
  // var a = require('undefined-debug');
  // var b = require('undefined-debug');
  // var c = require('undefined-debug');
  // var $ = require('$-debug');

  exports.get = function(id) {
    return $(id);
  };
});
