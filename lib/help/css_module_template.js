define('{{id}}', [], function() {
  function importStyle(cssText) {
    var element = document.createElement('style')
    document.getElementsByTagName('head')[0].appendChild(element)

    if (element.styleSheet) {
      element.styleSheet.cssText = cssText
    } else {
      element.appendChild(document.createTextNode(cssText))
    }
  }
  importStyle('{{css}}');
});
