
// simple log level(error, info, debug)

var util = require('util');
var argv = require('./commander').get();

var levels = {
  'log':   {'color': 37, 'priority': 1},
  'info':  {'color': 36, 'priority': 2},
  'warn':  {'color': 33, 'priority': 3},
  'error': {'color': 31, 'priority': 4}
};

var defaultLevel = 2;

if (argv.verbose) {
  defaultLevel = 1;
} else if (argv.quiet) {
  defaultLevel = 3;
}

var isDecorate = false;

function initLog(decos) {
  if (isDecorate) return;
  var temp = console['info'];

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

// getTrace(__stack[1]);
function getTrace(call) {
	return {
		file: call.getFileName(),
		lineno: call.getLineNumber(),
		timestamp: new Date().toUTCString()
	}
}

exports.init = function(isDecorate) {
  var decos = []; 
  if (isDecorate) {
    decos = ['log', 'info', 'warn', 'error'];
  }
  initLog(decos);
}

//console.info(1,2,3, 4);
//console.log(1,2,3);
//console.warn(1,2,3);
//console.error(1,2,3);
