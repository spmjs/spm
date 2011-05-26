/**
 * @fileoverview Annotation Parser.
 * @author yyfrankyy@gmail.com
 */

// string to be replaced
var replaces = [/^\/\*\*/, /^\*\//, /^\s?\*\s?/];

// parse text
function parse(text) {
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
    lines.forEach(function(line) {
        if (reg.test(line)) {
            line.replace(reg, function(all, key, value) {
                o[key] = o[key] || [];
                last = key;
                if (value) o[key].push(value);
            });
        }

        else if (last !== null) {
            o[last].push(line);
        }
    });

    return o;
}

(function(exp) {
    if (!exp) return;
    exp.defaultConfig = defaultConfig;
    exp.parse = parse;
    exp.replaces = replaces;
})(exports);
