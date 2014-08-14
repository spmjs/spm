var color = require('colorful');
var semver = require('semver');

module.exports = function print(pkg, options) {
  if (options.verbose) {
    console.log(JSON.stringify(pkg, null, 2));
    return;
  }
  var title = pkg.name;
  console.log('  ' + color.cyan(title));
  if (options.quiet) return;

  var versions = getVersions(pkg);
  if (versions.length) pkg = pkg.packages[versions[0]];

  if (pkg.tag) {
    var text = color.magenta(pkg.version) + ' ~ ' + color.blue(pkg.tag);
    if (pkg.private) {
      text = text + ' ~ ' + color.yellow('private');
    }
    if (pkg.updated_at) {
      text = text + ' ~ ' + color.green(pkg.updated_at);
    }
    console.log('  ' + text);
  }
  if (pkg.description) {
    console.log(' ', color.gray(pkg.description));
  }
  if (pkg.author) {
    console.log('  author: ' + (pkg.author.name || pkg.author));
  }
  if (versions.length) {
    var lines = Math.ceil(versions.length / 5);
    console.log('  versions:', color.magenta(versions.slice(0, 5).join('  ')));
    for (var i = 1; i < lines; i++) {
      console.log('            ' + color.magenta(versions.slice(i * 5, i * 5 + 5).join('  ')));
    }
  }
  if (pkg.homepage) {
    if (typeof pkg.homepage === 'string') {
      console.log('  homepage:', color.underline(pkg.homepage));
    } else if (pkg.homepage.url) {
      console.log('  homepage:', color.underline(pkg.homepage.url));
    }
  }
  if (pkg.repository) {
    if (typeof pkg.repository === 'string') {
      console.log('  repository:', color.underline(pkg.repository));
    } else if (pkg.repository.url) {
      console.log('  repository:', color.underline(pkg.repository.url));
    }
  }
};

function getVersions(pkg) {
  var versions = Object.keys(pkg.packages || {}).sort(function(a, b) {
    return semver.compare(b, a);
  });
  if (!pkg.tag) {
    return versions;
  }
  return versions.filter(function(version) {
    return pkg.packages[version].tag === pkg.tag;
  });
}
