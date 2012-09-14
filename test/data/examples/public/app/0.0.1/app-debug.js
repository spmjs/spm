define("app/0.0.1/app-debug", ["xbox/0.0.1/xbox-debug"], function(require, exports) {
  var xbox = require('xbox/0.0.1/xbox-debug');
  exports.show = function() {
    xbox.show();
  };
});
