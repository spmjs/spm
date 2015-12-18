'use strict';

var path = require('path');

module.exports = function(dep, file) {
  if (!isRelative(dep)) {
    return dep;
  }

  // ./a.js, B.md -> ./a.js
  // ../a.js, B/B.md -> ./a.js
  // ./a.js, B/B.md -> ./B/a.js
  // ./c/a.js, B/B.md -> ./B/c/a.js

  var ret = path.join(path.dirname(file), dep);
  if (!isRelative(ret)) {
    ret = './' + ret;
  }
  return ret;
};

function isRelative(file) {
  return file.charAt(0) === '.';
}
