// vim: set tabstop=2 shiftwidth=2:

/**
 * @fileoverview spm command line options.
 * @author yyfrankyy@gmail.com (Frank Xu)
 */
var argv = process.argv,
    transport = require('./transport'),
    console = require('./log');

argv.shift();
argv.shift();

var action = argv.shift();

function help() {
  console.log('Usage: spm [options] [action] [action-options]');
  console.log('           [module] [modules] ..');
  console.log('');
  console.log('try this:');
  console.log('    spm transport jquery');
  console.log('');
}

if (!action) {
  help();
}

var actions = {
  transport: function() {
    var args = [].slice.call(arguments);
    if (args[0] === 'all' || args.length === 0) {
      transport.buildAll();
    }

    else {
      args.forEach(transport.build);
    }
  },
  help: help
};

for (var i in actions) {
  if (i === action) {
    actions[i].apply(this, argv);
  }
}
