var should = require('should')
require('../index').logging.setlevel('error')
var config = require('../lib/system/config')

describe('config', function() {
  it('should get section.key', function() {
    config.config('section.key', 'value')
    config.config('section.key').should.equal('value')
    config.remove('section')
    should.not.exist(config.config('section.key'))
  })
})
