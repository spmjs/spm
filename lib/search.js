/* show information of the package */

var color = require('colorful');
var yuan = require('./sdk/yuan');
var log = require('./utils/log');

module.exports = function(options, callback) {
  yuan(options).search({query: options.query}, function(err, res, body) {
    if (err) {
      log.error('error', err);
      process.exit();
    } else {
      var msg;
      if (body.data.total === 1) {
        msg = '1 result';
      } else {
        msg = body.data.total + ' results';
      }
      console.log(' ', color.bold(msg));
      body.data.results.forEach(function(item) {
        console.log();
        print(item);
      });
      callback && callback();
    }
  });
};


function print(data) {
  var title = data.name;
  console.log('  ' + color.cyan(title));
  if (data.keywords && data.keywords.length) {
    console.log('  keys:', color.magenta(data.keywords.join(' ')));
  }
  if (data.description) {
    console.log('  desc:', color.grey(data.description));
  }
  if (data.homepage) {
    console.log('  link:', color.underline(data.homepage));
  }
  if (data.repository) {
    console.log('  repo:', color.underline(data.repository));
  }
}
