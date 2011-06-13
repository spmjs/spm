// vim: set tabstop=2 shiftwidth=2:

/**
 * @fileoverview spm command line options.
 * @author yyfrankyy@gmail.com (Frank Xu)
 */
var argv = process.argv,
    transport = require('./transport'),
    console = require('./log'),
    help = require('./help'),
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
    var args = [].slice.call(arguments),
        opts = {
          transport: options.force.concat(options.gzip),
          remove: options.force
        },
        completion = args[0],
        completionActions = {
          actions: function() {
            var compl = [];
            for (var i in commands) {
              if (i !== 'completion')
                compl.push(i);
            }
            return compl;
          },
          options: function() {
            var argsAction = args[1];
            if (argsAction in opts) {
              return opts[argsAction];
            }
            return [];
          },
          modules: function() {
            var transports = fs.readdirSync('transports');
            transports.forEach(function(t, i) {
              transports[i] = t.replace(/\.tspt$/, '');
            });
            return transports;
          }
        };

    for (var i in alias) {
      if (!(i in opts) && alias[i] in opts)
        opts[i] = opts[alias[i]];
    }

    if (completion in completionActions) {
      process.stdout.write(completionActions[completion]().join(' '));
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

  help: help.spm

};

if (!action) {
  help.welcome();
  actions.help();
  return;
}

// prepare for commands
var commands = {};
var alias = {
  build: ['transport'],
  rm: ['remove'],
  '--help': ['help']
};
for (var i in actions) {
  commands[i] = actions[i];
}
for (var i in alias) {
  commands[i] = actions[alias[i]];
}

// run
if (action in commands) {
  commands[action].apply(this, argv);
  return;
}

console.warn('unknown action %s', action);
actions.help();
