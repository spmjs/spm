/* show information of the package */

var color = require('colorful').color;
var yuan = require('./sdk/yuan');


module.exports = function(options) {
  options = options || {};
  var query = options.args[0];
  if (!query) {
    console.error('  no query string');
    process.exit(1);
  }

  options.query = query;
  yuan(options).search(function(err, res, body) {
    if (err) {
      console.error('error:', err);
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
      console.log();
    }
  });
};


function print(data) {
  var title = data.account + '/' + data.name;
  console.log('  ' + color.cyan(title));
  if (data.keywords && data.keywords.length) {
    console.log('  keys:', ' '.join(data.keywords));
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
