'use strict';

var path = require('path');
var grunt = require('grunt');
var ActionFactory = require('../core/action_factory.js');
var Commander = require('../utils/commander.js');

var Grunt = ActionFactory.create('Grunt');

Grunt.prototype.registerArgs = function() {
  var opts = this.opts;
  opts.description('使用 grunt 来执行当前命令.');
};

var gruntTask = path.join(path.dirname(module.filename), 'grunt');
var gruntHelpLib = path.join(path.dirname(require.resolve('grunt')), 'grunt', 'help.js');

Grunt.prototype.execute = function(opts, callback) {
  console.info('开始执行 grunt 任务');
  console.info();
  grunt.cli({
    tasks: [gruntTask]
  }, callback);
};

Grunt.prototype.help = function() {
  require(gruntHelpLib);
};

module.exports = Grunt;
