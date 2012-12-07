
exports.description = 'build a cmd module'

var logging = require('../terminal/logging')
require('../terminal/color').colorful()


exports.run = function(commander) {
  if (commander.interrupt) {
    logging.once('logging-warn', interrupt)
    logging.once('logging-error', interrupt)
  }
  logging.start('spm build')

  logging.debug('parsing command line arguments')
  // plugin.trigger('preparsing', commander)
  logging.debug('merge settings')

  logging.end('spm build finished!  ' + '❤'.to.magenta.color)
}


// helpers

function interrupt() {
  logging.end('The build process is interrupted!'.to.red_bg.color + '  ☂'.to.magenta.color)
  process.exit()
}
