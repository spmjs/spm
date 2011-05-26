var fs = require('fs'),
    transport = require('../../lib/transport');

var content = fs.readFileSync(__dirname + '/spec.js', 'utf8');
transport.build(content);
