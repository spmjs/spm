var argv = require('optimist')
    .usage('Usage: $0 -abc[use google Closure Compiler]') 
    .default('abc', '13')
    .argv;

describe('optimist test', function() {
  it('test default option', function() {
    expect(argv.abc).toBe('13');
  });
});
