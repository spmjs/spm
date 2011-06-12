// vim: set tabstop=2 shiftwidth=2:

/**
 * @fileoverview spm command line options.
 * @author yyfrankyy@gmail.com (Frank Xu)
 */
var argv = process.argv,
    transport = require('./transport'),
    console = require('./log'),
    path = require('path'),
    fs = require('fs');

// node spm.js [arguments]
// shift for 'node' and 'spm.js'
argv.shift();
argv.shift();

var action = argv.shift();

// TODO put all actions to actions directory
var actions = {

  transport: function() {
    var args = [].slice.call(arguments);
    if (args.length === 0) {
      transport.buildAll();
    }

    else {
      if (['--force', '-f'].indexOf(args[0]) > -1) {
        transport.config({
          force: true
        });
        args.shift();
      }
      if (args.length === 0) {
        transport.buildAll();
      } else {
        args.forEach(transport.build);
      }
    }
  },

  remove: function() {
    var args = [].slice.call(arguments);
    if (args.length === 0) {
      actions.help('remove');
    }

    else {
      var version = '';
      if (['--force', '-f'].indexOf(args[0]) > -1) {
        transport.config({
          force: true
        });
        args.shift();
      }
      if (['--version', '-v'].indexOf(args[0]) > -1) {
        args.shift();
        version = args.shift();
      }
      args.forEach(function(mod) {
        transport.remove(mod, version);
      });
    }
  },

  test: function() {
    var dirs = fs.readdirSync(path.join(__dirname, '../../test/spm'));
    var args = [].slice.call(arguments);
    var tests = args.length > 0 ? args : dirs;
    tests.forEach(function(mod) {
      console.info('running test on %s ..', mod);
      require(path.join('../../test/spm/', mod, 'test')).run();
    });
  },

  help: function() {
    console.log('Usage: spm [action] [action-options] [module] [module] ..');
    console.log('');
    console.log('use like this:');
    console.log('');
    console.log('    spm build jquery');
    console.log('');
    console.log('you can use or \'spm help\' for showing this help again');
  }

};

if (!action) {
  actions.help();
  return;
}

var compl = [];

// for more interactive actions
var commands = {
  build: actions.transport,
  transport: actions.transport,

  rm: actions.remove,
  remove: actions.remove,

  // auto complete commands
  completion: function() {
    process.stdout.write(compl.join(' '));
  },

  test: actions.test,

  help: actions.help,
  '--help': actions.help
};

// finish auto complete
for (var i in commands) {
  compl.push(i);
}

// run
for (var i in commands) {
  if (i === action) {
    commands[i].apply(this, argv);
    return;
  }
}

console.warn('unknown action %s', action);
actions.help();
