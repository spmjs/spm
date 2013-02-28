define("alice/m_js_css/1.0.0/b-debug", [], function(require, exports) {
    var c = require("alice/m_js_css/1.0.0/a.css");
    var d = require("alice/m_js_css/1.0.0/base1.css");
});
define('alice/m_js_css/1.0.0/a.css', [], function() {
  function importStyle(cssText) {
    var element = document.createElement('style')
    document.getElementsByTagName('head')[0].appendChild(element)

    if (element.styleSheet) {
      element.styleSheet.cssText = cssText
    } else {
      element.appendChild(document.createTextNode(cssText))
    }
  }
  importStyle('.a{color:#000;background:#fff}');
});

define('alice/m_js_css/1.0.0/base1.css', [], function() {
  function importStyle(cssText) {
    var element = document.createElement('style')
    document.getElementsByTagName('head')[0].appendChild(element)

    if (element.styleSheet) {
      element.styleSheet.cssText = cssText
    } else {
      element.appendChild(document.createTextNode(cssText))
    }
  }
  importStyle('.base1{color:#000;background:#fff}');
});
