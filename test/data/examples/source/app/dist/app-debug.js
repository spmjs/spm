define("xbox/0.0.1/xbox-debug", [], function(require, exports) {
  exports.show = function() {
    alert('hi, Im a xbox!');
  };
});


define("apop/0.0.1/apop-debug",[],function(e,t){t.show=function(){alert("hi, Im a apop!")}});

define("app/0.0.1/app-debug", ["xbox/0.0.1/xbox-debug", "apop/0.0.1/apop-debug"], function(require, exports) {
  var xbox = require('xbox/0.0.1/xbox-debug');
  var apop = require('apop/0.0.1/apop-debug');
  exports.show = function() {
    xbox.show();
    apop.show();
  };
});
