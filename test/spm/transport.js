var fs = require('fs'),
    transport = require('../../lib/transport');

var content = fs.readFileSync(__dirname + '/annotation-spec.js', 'utf8');
transport.parse(content);
