var util = require('util');


exports.run = function(options) {
};


var stream = require('stream');
function Builder(options) {
  stream.Stream.call(this);
  this.readable = true;
  this.writable = true;

  this.init(options);
}
util.inherits(Builder, stream.Stream);

Builder.prototype.init = function(options) {
};
