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

// handle boolean options
// TODO handle options which need more arguments
//      like this:
//         --version=1.2.0 or -v 1.2.0 or --version 1.2.0
var argsHelper = function(args) {
  var mods = [], opts = [], config = {};
  args.forEach(function(arg) {
    if (/^-/.test(arg) && opts.indexOf(arg) === -1) {
      if (opts.indexOf(arg) === -1) opts.push(arg);
    } else {
      mods.push(arg);
    }
  });

  opts.forEach(function(opt) {
    for (var i in options) {
      if (options[i].indexOf(opt) > -1) config[i] = true;
    }
  });

  return {
    opts: opts,
    config: config,
    mods: mods
  };
};

const options = {
  force: ['-f', '--force'],
  gzip: ['-g', '--gzip']
};

// TODO put all actions to actions directory
//      seperate them to single file
var actions = {

  transport: function() {
    var args = argsHelper([].slice.call(arguments)),
        mods = args.mods;
    transport.config(args.config);

    if (mods.length === 0) {
      transport.buildAll();
    } else {
      mods.forEach(transport.build);
    }
  },

  remove: function() {
    var args = argsHelper([].slice.call(arguments)),
        mods = args.mods;
    transport.config(args.config);

    if (mods.length === 0) {
      actions.help('remove');
    } else {
      mods.forEach(transport.remove);
    }
  },

  completion: function() {
    var args = [].slice.call(arguments);

    // actions
    if (args.length === 0) {
      process.stdout.write(compl.join(' '));
      return;
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
  completion: actions.completion,

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
