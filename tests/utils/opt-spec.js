var argv = require('optimist')
    .usage('Usage: $0 -abc[use google Closure Compiler]') 
    .default('abc', '13')
    .argv;

describe('optimist test', function() {
  it('test default option', function() {
    argv.abc.should.eql('13');
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

    argv1.s.should.eql('src');
    argv2.d.should.eql('dist');
    argv2.s.should.eql('src');
  });
});
