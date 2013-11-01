var request = require('request');
var semver = require('semver');
var fs = require('fs');
var path = require('path');
var log = require('./log');
var version = require('../../package').version;
require('colorful').colorful();

module.exports = function(callback) {
  
  // check every month
  var HOME = process.env.HOME;
  if (!HOME) {
    HOME = process.env.HOMEDRIVE + process.env.HOMEPATH;
  }
  var UPDATE_FILE = path.join(HOME, '.spm', 'autoupdate');
  var lastCheckDate;
  var NOW = Date.now();

  if (fs.existsSync(UPDATE_FILE)) {
    lastCheckDate = parseInt(fs.readFileSync(UPDATE_FILE), 10);
  }

  if (lastCheckDate && NOW - lastCheckDate < 86400000 * 30) {
    callback();
    return;
  }

  request({
    url: 'https://registry.npmjs.org/spm',
    strictSSL: false
  }, function (error, response, body) {
    if (error) {
      console.log(error);
    } else if (response.statusCode == 200) {
      var latest = JSON.parse(body)['dist-tags'].latest;
      if (semver.lt(latest, version)) {
        console.log();
        console.log(('  Your spm@' + version + ' is outdated, latest version is ' + latest + '.').to.yellow.color);
        console.log('  Try "npm install spm -g".'.to.green.color);
      }
    }
    fs.writeFileSync(UPDATE_FILE, NOW);
    callback();
  });
};
