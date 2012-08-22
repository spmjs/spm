var path = require('path');
var moduleHelp = require('../../lib/utils/moduleHelp.js');

describe('moduleHelp tools test', function() {
   it('test getBaseDepModulePath', function() {
     var m1 = 'lib/a.js';
     var m2 = '../core/b.js';
     var m3 = './core/b.js';
     var m4 = './c.js';
     expect(moduleHelp.getBaseDepModulePath(m1, m2)).toEqual('./core/b.js');
     expect(moduleHelp.getBaseDepModulePath(m3, m4)).toEqual('./core/c.js');
     //expect(moduleA).not.toBe(null);
     //expect(moduleA.name).toEqual('moduleA');
     //expect(moduleA.version).toEqual('0.9.17');
   });

   it('test base getRelativeBaseModulePath', function() {
     var m1 = 'lib/a.js';
     var m2 = './core/b.js';
     var m3 = './lib/c.js';

     expect(moduleHelp.getRelativeBaseModulePath(m1, m2)).toEqual('../core/b.js');
     expect(moduleHelp.getRelativeBaseModulePath(m1, m3)).toEqual('./c.js');
     expect(moduleHelp.getRelativeBaseModulePath(m2, m3)).toEqual('../lib/c.js');
   });
});


