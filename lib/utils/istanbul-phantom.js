var system = require('system');
var page = require('webpage').create();
var url = system.args[1];
/* global window,phantom */

page.open(url, function() {
  var interval = setInterval(function() {
    var isMochaDone = page.evaluate(function() {
      return window.mocha_done;
    });
    if (isMochaDone) {
      var cover = page.evaluate(function() {
        return window.__coverage__;
      });
      clearInterval(interval);
      system.stdout.write(JSON.stringify(cover));
      page.close();
      phantom.exit();
    }
  }, 1000);
});
