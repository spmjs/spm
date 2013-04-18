/* show information of the package */

var color = require('colorful');
var iduri = require('./sdk/iduri');
var yuan = require('./sdk/yuan');
var log = require('./utils/log');


module.exports = function(options) {
  var data = iduri.resolve(options.query);
  if (!data) {
    log.error('error', 'invalid module name');
    process.exit(2);
  }
  if (options.query.indexOf('/') === -1 && !data.version) {
    data.name = '';
  }
  yuan(options).info(data, function(err, res, body) {
    if (err) {
      console.log('  ' + color.cyan(data.family + '/' + data.name));
      console.log('  ' + color.red(err));
    } else if (res.statusCode !== 200) {
      console.log('  ' + color.cyan(data.family + '/' + data.name));
      console.log('  ' + color.red(body.message));
    } else {
      if (Array.isArray(body)) {
        var msg = '';
        if (body.length === 1) {
          msg = '1 package';
        } else {
          msg = body.length + ' packages';
        }
        console.log(' ', color.bold(msg));
        body.forEach(function(item) {
          console.log();
          print(item);
        });
      } else {
        print(body);
      }
    }
  });
};


function print(data) {
  var title = data.family + '/' + data.name;
  console.log('  ' + color.cyan(title));
  if (data.tag) {
    var text = color.magenta(data.version) + ' ~ ' + color.blue(data.tag);
    if (data.private) {
      text = text + ' ~ ' + color.yellow('private');
    }
    console.log('  ' + text);
  }
  if (data.versions) {
    var versions = data.versions;
    var lines = Math.ceil(versions.length / 5);
    console.log('  vers:', color.magenta(versions.slice(0, 5).join('  ')));
    for (var i = 1; i < lines; i++) {
      console.log('        ' + color.magenta(versions.slice(i * 5, i * 5 + 5).join('  ')));
    }
  }
  if (data.description) {
    console.log('  desc:', color.gray(data.description));
  }
  if (data.homepage) {
    if (typeof data.homepage === 'string') {
      console.log('  link:', color.underline(data.homepage));
    } else if (data.homepage.url) {
      console.log('  link:', color.underline(data.homepage.url));
    }
  }
  if (data.repository) {
    if (typeof data.repository === 'string') {
      console.log('  repo:', color.underline(data.repository));
    } else if (data.repository.url) {
      console.log('  repo:', color.underline(data.repository.url));
    }
  }
}
