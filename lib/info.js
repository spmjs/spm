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
        if (options.quiet) {
          console.log();
        }
        body.forEach(function(item) {
          if (!options.quiet) {
            console.log();
          }
          print(item, options);
        });
      } else {
        print(body, options);
      }
    }
  });
};


function print(data, options) {
  if (options.verbose) {
    console.log(JSON.stringify(data, null, 2));
    return;
  }
  var title = data.family + '/' + data.name;
  console.log('  ' + color.cyan(title));
  if (options.quiet) {
    return;
  }
  if (data.tag) {
    var text = color.magenta(data.version) + ' ~ ' + color.blue(data.tag);
    if (data.private) {
      text = text + ' ~ ' + color.yellow('private');
    }
    if (data.updated_at) {
      text = text + ' ~ ' + color.green(data.updated_at);
    }
    console.log('  ' + text);
  }
  if (data.description) {
    console.log(' ', color.gray(data.description));
  }
  if (data.author) {
    console.log('  author: ' + (data.author.name || data.author));
  }
  if (data.versions) {
    var versions = data.versions;
    var lines = Math.ceil(versions.length / 5);
    console.log('  versions:', color.magenta(versions.slice(0, 5).join('  ')));
    for (var i = 1; i < lines; i++) {
      console.log('        ' + color.magenta(versions.slice(i * 5, i * 5 + 5).join('  ')));
    }
  }
  if (data.homepage) {
    if (typeof data.homepage === 'string') {
      console.log('  homepage:', color.underline(data.homepage));
    } else if (data.homepage.url) {
      console.log('  homepage:', color.underline(data.homepage.url));
    }
  }
  if (data.repository) {
    if (typeof data.repository === 'string') {
      console.log('  repository:', color.underline(data.repository));
    } else if (data.repository.url) {
      console.log('  repository:', color.underline(data.repository.url));
    }
  }
}
