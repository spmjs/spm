var path = require('path');
var moduleHelp = require('../../lib/utils/module_help.js');

describe('moduleHelp tools test', function() {
   it('test getBaseDepModulePath', function() {
     var m1 = 'lib/a.js';
     var m2 = '../core/b.js';
     var m3 = './core/b.js';
     var m4 = './c.js';

     moduleHelp.getBaseDepModulePath(m1, m2).should.eql('./core/b.js');
     moduleHelp.getBaseDepModulePath(m3, m4).should.eql('./core/c.js');
     //expect(moduleA).not.toBe(null);
     //expect(moduleA.name).toEqual('moduleA');
     //expect(moduleA.version).toEqual('0.9.17');
   });

   it('test base getRelativeBaseModulePath', function() {
     var m1 = 'lib/a.js';
     var m2 = './core/b.js';
     var m3 = './lib/c.js';

     moduleHelp.getRelativeBaseModulePath(m1, m2).should.eql('../core/b.js');
     moduleHelp.getRelativeBaseModulePath(m1, m3).should.eql('./c.js');
     moduleHelp.getRelativeBaseModulePath(m2, m3).should.eql('../lib/c.js');
   });
});


