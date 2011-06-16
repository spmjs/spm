// vim: set tabstop=2 shiftwidth=2:

/**
 * @fileoverview SeaJS Package Manager.
 * @author yyfrankyy@gmail.com (Frank Xu)
 */

require('colors');

var argv = process.argv,
    transport = require('./actions/transport'),
    help = require('./help'),
    path = require('path'),
    opts = require('./helper/opts'),
    fs = require('fs');

var action = argv.shift();

var actions = {

  transport: function() {
    var args = opts.parse([].slice.call(arguments)),
        mods = args.mods;
    transport.config(args.config);

    if (mods.length === 0) {
      transport.buildAll();
    } else {
      mods.forEach(transport.build);
    }
  },

  remove: function() {
    var args = opts.parse([].slice.call(arguments)),
        mods = args.mods;
    transport.config(args.config);

    if (mods.length === 0) {
      actions.help('remove');
    } else {
      mods.forEach(transport.remove);
    }
  },

  completion: function() {
    const options = {
      force: ['-f', '--force'],
      gzip: ['-g', '--gzip']
    };

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
  },

  help: help.spm

};

var Actions = ['build', 'test'];
Actions.forEach(function(action) {
  actions[action] = function() {
    var act = require('./actions/' + action);
    var args = opts.parse([].slice.call(arguments));
    var ins = new act();
    console.log(ins.completion);
    ins.run(args);
  };
});

console.log(actions);

if (!action) {
  actions.help();
  return;
}

// prepare for commands
var commands = {};
var alias = {
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
