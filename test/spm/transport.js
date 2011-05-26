var fs = require('fs'),
    transport = require('../../lib/transport');

var content = fs.readFileSync(__dirname + '/spec.js', 'utf8');
var o = transport.parse(content);
if (o.meta.src.length > 0) {
    transport.getData(o.meta.src[0], function(data) {
        transport.getVersion(data);
        // console.log(data);
    });
}

/*
if (o.meta.min.length > 0) {
    transport.getData(o.meta.min[0], function(data) {
        console.log(data);
    });
}
*/
