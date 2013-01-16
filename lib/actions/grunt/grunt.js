// 允许用户在执行 spm 标准 action 的同时也执行 grunt 相关配置，主要
// 可以允许一些收尾操作.
// grunt 默认的 task 不能是spm 默认的 action

'use strict';

var _ = require('underscore');
var argv = require('../../utils/commander').get();
var ActionFactory = require('../../core/action_factory.js');

module.exports = function(grunt) {

  grunt.registerTask('grunt', 'empty task.', function() {

    console.log('执行 spm grunt!');
    console.log('skip grunt task.'); 

    if (_.isEqual(argv.args.slice(1), ['grunt']) || _.isEqual(argv.args, ['grunt'])) {
      grunt.task.run('default');
    }
  });
  
  var defaultActionList = ActionFactory.getDefaultActionList();
  
  argv.args.forEach(function(action) {
    if (action == 'grunt') return;
    if (defaultActionList.indexOf(action) > -1) {
      grunt.registerTask(action, 'spm default action', function() {
        console.log('skip ' + action + ' task.'); 
        var noGruntTask = argv.args.every(function(arg) {
          return defaultActionList.indexOf(arg) < 0;
        });

        if (noGruntTask) {
          grunt.task.run('default');
        }
      });
    }
  });
};
