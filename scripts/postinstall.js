var exeq = require('exeq');
var colorful = require('colorful');

var isPhantomInstalled = true;
try {
  require('phantomjs');
  console.log(colorful.cyan('[spm:preinstall] Phantomjs is installed in %s'), require.resolve('phantomjs'));
} catch(e) {
  isPhantomInstalled = false;
}

if (!isPhantomInstalled) {
  if (!process.env.PHANTOMJS_CDNURL) {
    process.env.PHANTOMJS_CDNURL = 'http://npm.taobao.org/dist/phantomjs';
  }
  var cmd = 'npm install phantomjs -g';
  console.log(colorful.cyan('[spm:preinstall] Use PHANTOMJS_CDNURL=%s %s'),
    process.env.PHANTOMJS_CDNURL, cmd);
  exeq(cmd).then(function() {
    console.log(colorful.cyan('[spm:preinstall] Phantomjs installed in %s'), require.resolve('phantomjs'));
  });
}
