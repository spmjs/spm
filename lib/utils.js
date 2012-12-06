var fs = require('fs')
var path = require('path')

exports.safeWrite = function(filepath) {
  var dir = path.dirname(filepath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir)
  }
}
