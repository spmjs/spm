// vim: set tabstop=2 shiftwidth=2:

/**
 * @fileoverview transport external modules to seajs compatible code.
 * @author yyfrankyy@gmail.com (Frank Xu)
 */

var undefined, opts = exports;

opts.ERR_OPTION_ARGUMENTS_NOT_ENOUGH =
    new Error('Option arguments not enough.');

// options parser
//
// get this array:
//
//     a b c --dddd e -f g
//
// configs:
//
//     {
//       'd': {
//         alias: ['-d', '--dddd'],
//         length: 1
//       }
//     }
//
// parse into:
//
//     {
//       config: {
//         'd': [e],
//         '-f': [true]
//       },
//       mods: ['a', 'b', 'c', 'g']
//     }
//
opts.parse = function(args, configs) {
  var mods = [],
      options = [],
      config = {},
      configs = configs || {};

  for (var i = 0, l = args.length; i < l; i++) {
    var arg = args[i];

    // is an options, start with `-`
    if (/^-/.test(arg)) {

      // ignore extra options
      if (options.indexOf(arg) !== -1) continue;

      options.push(arg);

      if (!(arg in configs)) {
        config[arg] = [true];
      }

      for (var j in configs) {
        var length = configs[j].length || 0,
            alias = configs[j].alias || [arg];

        if (alias.indexOf(arg) === -1) continue;

        // have more arguments for this options
        if (length > 0) {
          while (length-- > 0) {
            i++;
            config[j] = config[j] || [];

            if (args[i] === undefined) {
              throw opts.ERR_OPTION_ARGUMENTS_NOT_ENOUGH;
            }
            config[j].push(args[i]);
          }
        } else {
          config[j] = [true];
        }
        break;
      }

    } else {
      mods.push(arg);
    }
  }

  return {
    config: config,
    mods: mods
  };
};
