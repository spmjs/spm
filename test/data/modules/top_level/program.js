define(function(require) {

  var inc = require('./biz/increment').increment;

  console.log('The result of inc(1) is', inc(1));

});
