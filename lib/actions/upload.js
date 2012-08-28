var Build = require('./build.js');
var ActionFactory = require('../core/action_factory.js');
var Opts = require('../utils/opts');

var Upload = ActionFactory.create('upload', 'build');

Upload.prototype.registerArgs = function() {
  var opts = this.opts;
  opts.help('upload a module to sources.\nusage: spm upload [options]');
  opts.extend(Opts.get('build'));
}

module.exports = Upload;
