
// simple log level(error, info, debug)

var levels = {
  'log':   {'color': 37, 'priority': 1},
  'info':  {'color': 36, 'priority': 2},
  'warn':  {'color': 33, 'priority': 3},
  'error': {'color': 31, 'priority': 4}
};

var argv = require('optimist').
    usage('Usage: $0 -X[DEBUG MODEL]')[ 
    'default']('X', levels.log.priority).
    argv;

var defaultLevel = argv.X; 
var isDecorate = false;

function initLog() {
    if (isDecorate) return;
	var decos = ['log', 'info', 'warn', 'error'];
	decos.forEach(function(log) {
		clogs = console[log];
		console[log] = function() {
			if ( levels[log].priority >= defaultLevel ) {
			  var args = [].slice.call(arguments);
			  if (log === 'info') {
			    clogs.apply(console, args); 
              } else {
			    clogs.apply(console, ['\x1B[' + levels[log].color + 'm >>> '].concat(args).concat([' \x1B[39m']));
              }
			}
		}
	});
	isDecorate = true;
}


initLog();

//console.info(1,2,3, 4);
//console.log(1,2,3);
//console.warn(1,2,3);
//console.error(1,2,3);


