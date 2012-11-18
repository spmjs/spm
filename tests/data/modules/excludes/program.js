define(function(require) {

  var a = require('./a');
  console.log(a.name);

  require('lib-x');
  require('lib-z');
});
