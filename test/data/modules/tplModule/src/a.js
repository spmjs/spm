define(function(require, exports, module) {

    //var a = require('./a.html');
    var b1 = require('./b.tpl');
    var b2 = require.async('./c.htm');
    //var c = require('./c.htm');

    exports.say = function() {
      console.info('a---->', a);
      //console.info('b---->', b);
      //console.info('c---->', c);
    };

});
