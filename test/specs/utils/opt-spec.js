var argv = require('optimist')
    .usage('Usage: $0 -abc[use google Closure Compiler]') 
    .default('abc', '13')
    .argv;

describe('optimist test', function() {
  it('test default option', function() {
    expect(argv.abc).toBe('13');
  });

  it('test multi argv', function() {
    var argv1 = require('optimist').option('s', {
      alias: 'src',
      default: 'src'
    }).argv;

    var argv2 = require('optimist').option('d', {
      alias: 'dist',
      default: 'dist'
    }).argv;

    expect(argv1.s).toBe('src');
    expect(argv2.d).toBe('dist');
    expect(argv2.s).toBe('src');
  });
});
