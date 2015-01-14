var exec = require('child_process').exec;

if (!process.env.PHANTOMJS_CDNURL) {
  process.env.PHANTOMJS_CDNURL = 'http://npm.taobao.org/dist/phantomjs';
  console.log('PHANTOMJS_CDNURL=%s npm install phantomjs', process.env.PHANTOMJS_CDNURL);
  var install = exec('npm install phantomjs -f', {
    env: process.env
  });

  install.stdout.on('data', function(data) {
    process.stdout.write(data);
  });

  install.stderr.on('data', function(data) {
    process.stdout.write(data);
  });
} else {
  console.log('use PHANTOMJS_CDNURL=%s', process.env.PHANTOMJS_CDNURL);
}
