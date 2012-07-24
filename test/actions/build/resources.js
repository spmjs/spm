var path = require('path');

function testModuleRelative() {
  var m1 = 'm1.js';
  var m2 = 'plugin/p1';
  var m3 = '../const';
  var m4 = 'plugin/p2'
  var m5 = './effect';
  
  console.log(path.join(path.dirname(m1), path.dirname(m2), m5));
  console.log(path.join(path.dirname(m2), path.dirname(m2), m3));
}

function equal(a, b) {
  if (a !== b) {
    throw 'expect ' + a + '==' + b;
  }
}
testModuleRelative();
