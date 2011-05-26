/**
 * @fileoverview Annotaion Parser.
 * @author yyfrankyy<yyfrankyy@gmail.com>
 */

// default template
var defaultConfig = {
    name: '',
    desc: '',
    url: '',
    tags: [],
    src: '',
    min: '',
    license: ''
};

// string to be replaced
var replaces = [/^\/\*\*/, /^\*\//, /^\s?\*\s?/];

// generate keys from defaultConfig
var keys = [];
function generateDefaultKeys() {
    keys = [];
    for (var i in defaultConfig) {
        keys.push(i);
    }
}

// parse text
function parse(text) {
    generateDefaultKeys();

    var _lines = text.split(/\n|\r/), lines = [], line, replace;

    // replace extra strings
    _lines.forEach(function(line) {
        line = line.trim();
        if (line === '') return;
        for (var j = 0, k = replaces.length; j < k; j++) {
            replace = replaces[j];
            if (!replace.test(line)) continue;
            line = line.replace(replace, '').trim();
            if (line !== '') lines.push(line);
        }
    });

    // transform to object
    var o = {}, last = null, reg = /^\@(\b\w+\b)\s?(.*)?/;
    keys.forEach(function(k) {
        o[k] = [];
    });
    lines.forEach(function(line) {
        if (reg.test(line)) {
            line.replace(reg, function(all, key, value) {
                if (key in o) {
                    last = key;
                    if (value)
                        o[key].push(value);
                }

                else if (last !== null) {
                    o[last].push(value);
                }

                // drop else
            });
        }

        else if (last !== null) {
            o[last].push(line);
        }
    });

    // set default value
    for (var i in defaultConfig) {
        if (i in o) continue;
        o[i] = cfg[i];
    }

    return o;
}

(function(exp) {
    if (!exp) return;
    exp.defaultConfig = defaultConfig;
    exp.parse = parse;
    exp.replaces = replaces;
})(exports);
