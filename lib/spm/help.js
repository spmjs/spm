// vim: set tabstop=2 shiftwidth=2:

/**
 * @fileoverview help message for spm.
 * @author yyfrankyy@gmail.com (Frank Xu)
 */

var help = exports;

help.gzip = function() {
  console.log('gzip is not supported'.yellow);
};

help.version = function(version) {
  console.log('%s is not a valid publish version'.yellow, version);
  console.log('we use http://semver.org/ for validating version number');
  console.log('you can use force mode to force build this unstable version');
};

help.moduleExists = function(src, name) {
  console.log('%s already exists, ignore'.yellow, src);
  console.log('update version information in your %s.tspt', name);
  console.log('or use force mode to update');
};

help.spm = function() {
  console.log('');
  help.welcome();
  console.log('ACTIONS'.cyan +
      ' - run "spm help" for showing this help again.');
  console.log('=======================================================');
  console.log('Usage: spm [action] [action-options] [module] [module] ..');
  console.log('');
  console.log('build/transport:'.cyan);
  console.log('  Transport module code to seajs modules.'.green);
  console.log('    $ spm build jquery');
  console.log('');
  console.log('rm/remove:'.cyan);
  console.log('  remove module from seajs modules.'.green);
  console.log('    $ spm remove jquery');
  console.log('');
  console.log('KEEP IN TOUCH'.cyan + ' - Visit ' +
      'https://github.com/seajs/spm'.green + ' for more details');
  console.log('=======================================================');
  console.log('Any Recommendations, please feel free to contact ' +
      '@lifesinger'.yellow + ' or ' + '@yyfrankyy'.yellow + ' on twitter.');
  console.log('');
};

help.welcome = function() {
  console.log('Welcome to SPM'.cyan + ' - A Package Manager for SeaJS');
  console.log('=======================================================');
  console.log('');
  console.log('       .d8888b.                 888888  .d8888b.  '.yellow);
  console.log('      d88P  Y88b                  "88b d88P  Y88b '.yellow);
  console.log('      Y88b.                        888 Y88b.      '.yellow);
  console.log('       "Y888b.    .d88b.   8888b.  888  "Y888b.   '.yellow);
  console.log('          "Y88b. d8P  Y8b     "88b 888     "Y88b. '.yellow);
  console.log('            "888 88888888 .d888888 888       "888 '.yellow);
  console.log('      Y88b  d88P Y8b.     888  888 88P Y88b  d88P '.yellow);
  console.log('       "Y8888P"   "Y8888  "Y888888 888  "Y8888P"  '.yellow);
  console.log('                                 .d88P            '.yellow);
  console.log('                               .d88P"             '.yellow);
  console.log('                              888P"               '.yellow);
  console.log('');
};
