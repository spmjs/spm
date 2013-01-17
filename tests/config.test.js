var should = require('should');
var require = require('./testutils');
var config = require('../lib/commands/config');

describe('config', function() {
  it('should get section.key', function() {
    config.config('section.key', 'value');
    config.config('section.key').should.equal('value');
    config.remove('section');
    should.not.exist(config.config('section.key'));
  });
});
