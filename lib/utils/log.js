
// simple log level(error, info, debug)

var util = require('util');
var opts = require('./opts').get();
var levels = {
  'log':   {'color': 37, 'priority': 1},
  'info':  {'color': 36, 'priority': 2},
  'warn':  {'color': 33, 'priority': 3},
  'error': {'color': 31, 'priority': 4}
};

opts.add('v', 'verbose', 'Show more verbose information.');
opts.defaultValue('verbose', levels.info.priority);

var argv = opts.argv;
var defaultLevel = argv.v;
var isDecorate = false;

function initLog() {
  if (isDecorate) return;
  var temp = console['info'];

  var decos = ['log', 'info', 'warn', 'error'];
  decos.forEach(function(log) {
    clogs = console[log];

    console[log] = function() {
      if (levels[log].priority >= defaultLevel) {
        var args = [].slice.call(arguments);
        var std = 'stdout';

        if (log === 'error') {
          std = 'stderr';
              }

              if (log !== 'info') {
                args.unshift('[' + log.toUpperCase() + ']');
                args = ['\x1B[' + levels[log].color + 'm'].concat(args).concat([' \x1B[39m']);
              }

              process[std].write(util.format.apply(console, args) + '\n');
      }
    };
  });

  console.segm = function() {
    console.info('------------------------------------------------------------------------');
  };

  console.empty = function() {
    console.info('');
  };

  isDecorate = true;
}

initLog();

//console.info(1,2,3, 4);
//console.log(1,2,3);
//console.warn(1,2,3);
//console.error(1,2,3);
