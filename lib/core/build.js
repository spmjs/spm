
exports.description = 'build a cmd module'

var logging = require('../terminal/logging')


exports.run = function(commander) {
  logging.start('spm build')
  logging.debug('parsing command line arguments')
  // plugin.trigger('preparsing', commander)
  logging.debug('merge settings')
}
