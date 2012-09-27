define(function(require, exports, module) {
  var c = require('../controller/c.js'); 

  exports.show = function(m) {
    m = c.getData(m);
    return render(m);
  };

  function render() {
  
  }
});

