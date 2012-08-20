var path = require('path');
var ProjectFactory = require('../../lib/plugins/dependencies.js');

describe('dependencies plugin test', function() {
   it('test relative dir calculate', function() {
     var m1 = 'lib/a.js';
     var m2 = '../core/b.js';
     var m3 = './core/b.js';
     var m4 = './c.js';
     expect(getBaseModulePath(m1, m2)).toEqual('./core/b.js');
     expect(getBaseModulePath(m3, m4)).toEqual('./core/c.js');
     //expect(moduleA).not.toBe(null);
     //expect(moduleA.name).toEqual('moduleA');
     //expect(moduleA.version).toEqual('0.9.17');
   });

   it('test base module dependencies', function() {
     var m1 = 'lib/a.js';
     var m2 = './core/b.js';
     var m3 = './lib/c.js';

     expect(getBaseRelativeModulePath(m1, m2)).toEqual('../core/b.js');
     expect(getBaseRelativeModulePath(m1, m3)).toEqual('./c.js');
     expect(getBaseRelativeModulePath(m2, m3)).toEqual('../lib/c.js');
   });
});

// 根据两个模块，计算出相对于base的完整path路径.
function getBaseModulePath(main, dep) {
  return './' + path.join(path.dirname(main), dep);
}

function getBaseRelativeModulePath(base, module) {
  var module = path.relative(path.dirname(base), module);
  if (module.indexOf('.') !== 0) {
    module = './' + module;
  }
  return module;
}

