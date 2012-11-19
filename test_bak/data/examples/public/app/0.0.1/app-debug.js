define("#app/0.0.1/sub_mod-debug", [], function(require, exports) {
  exports.hi = function() {
    alert('hi');
  };
});


define("#xbox/0.0.1/xbox-debug", [], function(require, exports) {
  exports.show = function() {
    alert('hi, Im a xbox!');
  };
});


define("#apop/0.0.1/apop-debug", [], function(require, exports) {
  exports.show = function() {
    alert('hi, Im a apop!');
  };
});


define("#app/0.0.1/app-debug", ["./sub_mod-debug", "#xbox/0.0.1/xbox-debug", "#apop/0.0.1/apop-debug"], function(require, exports) {
  var xbox = require('#xbox/0.0.1/xbox-debug');
  var apop = require('#apop/0.0.1/apop-debug');
  var sub = require('./sub_mod-debug');

  seajs.importStyle('div{border:1px solid red;width:200px;height:200px}', '#app/0.0.1/style');

  exports.show = function() {
    xbox.show();
    apop.show();
  };
});
