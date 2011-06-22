// vim: set tabstop=2 shiftwidth=2:

/**
 * @fileoverview All Messages here.
 * @author yyfrankyy@gmail.com (Frank Xu)
 */

require('colors');

var message = exports;

// Notice {{{
message.MODULE_EXISTS =
    '%s already exists, ignore' +
    '\nupdate version information in your %s.tspt' +
    '\nor use force mode to update';

message.USE_FORCE_MODE =
    'Using force mode';

message.BUILT_SOURCE_CODE =
    'Built %s source code. size: %s';

message.BUILT_MINIFIED_CODE =
    'Built %s minified code. size: %s';

message.BUILT_BY_UGLIFYJS =
    'No minified code provided at %s, minifing by UglifyJS';

message.INVALID_VERSION_NUMBER =
    '%s is not a valid publish version\n' +
    'we use http://semver.org/ for validating version number\n' +
    'you can use force mode to force build this unstable version';

message.GZIP_NOT_SUPPORTED =
    'gzip is not supported'.yellow;

message.SEAJS_NOT_EXISTS =
    'sea.js does not exists.'.yellow;
// }}}

// Help {{{
// Transport Help {{{
message.TRANSPORT_HELP =
    'transport\n'.cyan +
    '  transport your code to seajs compatible modules.\n' +
    '    example: $ spm transport jquery'.yellow;

message.TRANSPORT_HELP_OPTIONS =
    '  --force/-f:\n'.cyan +
    '    use force mode for transporting.\n' +
    '  --gzip/-g:\n'.cyan +
    '    gzip transporting result.';
// }}}
// Remove Help {{{
message.REMOVE_HELP =
    'remove\n'.cyan +
    '  remove your code from local seajs modules.\n' +
    '    example: $ spm remove jquery'.yellow;

message.REMOVE_HELP_OPTIONS =
    '  --force/-f:\n'.cyan +
    '    use force mode for removing.';
// }}}
// Test Help {{{
message.TEST_HELP =
    'test\n'.cyan +
    '  run test speces of spm.\n' +
    '    example: $ spm test opts'.yellow;
// }}}
// }}}
