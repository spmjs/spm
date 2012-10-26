define(function(require, exports, module) {
    var $ = require('$')
    var random = require('./util').random
    
    function handleText(text){
        var min = random(30,70)
        var max = random(50,120)
        var rt = ''
        for(var i = 0, len = text.length; i < len; i++){
            rt += '<span style="font-size:' + random(min, max) + 'px;">' + text[i] + '</span>'
        }
        return rt
    }
    
    module.exports = handleText
})
