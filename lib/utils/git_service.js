// 从git 仓库获取代码

var util  = require('util'),
    spawn = require('child_process').spawn,
    ls    = spawn('ls', ['-lh', process.cwd()]);

ls.stdout.on('data', function (data) {
  console.log('stdout: ' + data);
});

ls.stderr.on('data', function (data) {
  console.log('stderr: ' + data);
});

ls.on('exit', function (code) {
  console.log('child process exited with code ' + code);
});


