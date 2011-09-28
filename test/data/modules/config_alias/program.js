define(function(require) {

  var inc = require('./sub/increment').increment;
  require('querystring:1.0.0');

  console.log('The result of inc(1) is', inc(1));

});
