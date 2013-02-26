define('{{id}}', [], function() {
  function importStyle(cssText) {
    var element = document.createElement('style')
    doc.getElementsByTagName('head')[0].appendChild(element)

    if (element.styleSheet) {
      element.styleSheet.cssText = cssText
    } else {
      element.appendChild(doc.createTextNode(cssText))
    }
    importStyle('{{css}}');
  }
};
