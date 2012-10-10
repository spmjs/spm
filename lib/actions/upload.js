var Build = require('./build.js');
var ActionFactory = require('../core/action_factory.js');
var Opts = require('../utils/opts');

var Upload = ActionFactory.create('upload', 'build');

Upload.prototype.registerArgs = function() {
  Upload.super_.prototype.registerArgs.call(this);
  var opts = this.opts;
  opts.help('upload a module to sources.');
  opts.extend(Opts.get('build'));
}

module.exports = Upload;
