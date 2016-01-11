var fs = require('fs');

module.exports = {
  afterEnd: function(reporter) {
    var coverage = reporter.page.evaluate(function() {
      return window.__coverage__;
    });
    if (coverage) {
      fs.write('_site/coverage.json', JSON.stringify(coverage), 'w');
    }
  }
};
