'use strict';

var NAME_REGEX = require('../sdk/iduri').NAME_REGEX;

exports.description = 'Create a spm package.';

exports.notes = '';

exports.warnOn = '*';

exports.template = function(grunt, init, done) {

  init.process({type: 'spmjs'}, [
    // Prompt for these values.
    grunt.util._.extend(init.prompt('name'), {
      message : 'Package name',
      warning: 'Must be only lowercase letters, numbers or dashes, and start with lowercase letter.',
      validator: NAME_REGEX
    }),
    init.prompt('author'),
    init.prompt('version', '1.0.0'),
    init.prompt('description', ''),
    init.prompt('repository'),
    init.prompt('homepage'),
    init.prompt('licenses', 'MIT')
  ], function(err, props) {

    var files = init.filesToCopy(props);

    props.varName = props.name.replace(/\-(\w)/g, function(all, letter){
      return letter.toUpperCase();
    });

    // Actually copy (and process) files.
    init.copyAndProcess(files, props);

    // All done!
    done();
  });
};
