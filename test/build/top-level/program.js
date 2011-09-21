define(function(require) {

  var inc = require('./increment').increment;
  require('querystring/1.0.0/querystring');

  console.log('The result of inc(1) is', inc(1));

});
