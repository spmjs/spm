// vim: set tabstop=2 shiftwidth=2:

/**
 * @fileoverview All Messages here.
 * @author yyfrankyy@gmail.com (Frank Xu)
 */

var message = exports;

message.MODULE_NOT_EXISTS =
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
