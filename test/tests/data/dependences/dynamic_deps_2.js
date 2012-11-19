define(function(require) {
  require('a');
  require('b');
  // require('c');
  var d = 'd';
  require(d);
  require('e1' + 'e2');
});
