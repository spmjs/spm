// vim: set tabstop=2 shiftwidth=2:

/**
 * @fileoverview transport external modules to seajs compatible code.
 * @author yyfrankyy@gmail.com (Frank Xu)
 */


function remove(mod, version) {
  if (!config.force) {
    process.stdout.write('are you sure want to remove "' + mod + '"? [Yn]: ');
    process.stdin.resume();
    process.stdin.on('keypress', function(char, key) {
      if (key && key.name == 'y') {
        console.info('%s have been removed successfully', mod);
        process.exit();
      } else {
        process.exit();
      }
    });
  } else {
    util.rmdirForce(path.join(MODULES_DIR, mod, version || ''));
    webAPI.remove(mod);
    console.info('%s have been removed successfully (force mode)', mod);
  }
}


function remove(mod, version) {
  util.rmdirForce(path.join(MODULES_DIR, mod, version || ''));
  webAPI.remove(mod);
}
