// fileoverview Extensions for filesystem utilities.

var fs = require('fs');
var path = require('path');
var url = require('url');
var WinOS = require('./win_os.js');


/**
 * rm -rf dir.
 * @param {String} dir 文件路径.
 */
exports.rmdirRF = function(dir) {
    if (!path.existsSync(dir)) return;

    fs.readdirSync(dir).forEach(function(name) {
        var item = path.join(dir, name);

        if (fs.statSync(item).isFile()) {
            fs.unlinkSync(item);
        }
        else {
            exports.rmdirRF(item);
        }
    });

    fs.rmdirSync(dir);
};

/**
 * mkdir -s dir.
 * @param {String} dir 文件路径.
 */
exports.mkdirS = function(dir) {
    dir = WinOS.normalizePath(dir);
    var p = dir.replace(/\/$/, '');
    var parts = [];

    while (!/\/$/.test(p) && !path.existsSync(p)) {
        parts.unshift(path.basename(p));
        p = path.dirname(p);
    }

    while (parts.length) {
        p = path.join(p, parts.shift());
        fs.mkdirSync(p, '0777');
    }
};

/**
 * 同步读取文件内容
 * @param {String} filePath 文件路径.
 * @param {String} filename 文件名.
 * @return {String} 文件内容.
 */
exports.readFileSync = function(filePath, filename) {
    var fileStr = null;

    try {
        fileStr = fs.readFileSync(path.join(filePath, filename));
    } catch (e) {
        throw filename + ' load failure!';
    }
    return fileStr + '';
};

/**
 * 同步写入文件
 * @param {String} filePath 写入路径.
 * @param {String} fileContent 写入内容.
 */
exports.writeFileSync = function(filePath, fileContent) {
    var dir = path.dirname(filePath);
    if (!path.existsSync(dir)) {
        exports.mkdirS(dir);
    }
    fs.writeFileSync(filePath, fileContent, 'utf8');
};

/**
 * read content from http(s)/local filesystem
 * @param {String} uri 文件路径，或者url.
 * @param {Function} callback 回调函数.
 * @param {String} charset 文件编码.
 * @return {void} 无返回.
 */
exports.readFile = function(uri, callback, charset) {
    if (!uri || typeof callback !== 'function') {
        return;
    }

    console.log('  ... Fetching %s', uri);

    // read from network
    if (/^https?:\/\//.test(uri)) {

        var options = url.parse(uri);
        options.path = options.pathname;
        var request = require(options.protocol.slice(0, -1));

        var req = request.get(options, function(res) {

          // 200
            if (res.statusCode === 200) {
                var data = '';
                var times = 0;

                res.on('data', function(chuck) {
                    if (++times > 2) {
                        process.stdout.write(times === 3 ? '  ...' : '.');
                    }
                    data += chuck.toString();
                });

                res.on('end', function() {
                    if (times > 2) {
                        process.stdout.write('\n');
                    }
                    callback(data);
                });
                return;
            }

            // redirect
            var redirect = res.headers.location;
            if (redirect) {
                exports.readFile(redirect, callback);
            }

            // others
            else {
                console.error('Error: No data received from %s.', uri);
                callback('');
            }
        });

        req.on('error', function(e) {
            console.error(e.message);
            callback('');
        });
    }
    // read from local filesystem
    else {
        return fs.readFile(uri, charset || 'utf8', function(err, data) {
            if (err) throw err + '\n       uri = ' + uri;
            callback(data);
        });
    }
};

// 通过copy 目录.
exports.copyDirSync = function(srcDirectory, targetDirectory) {
    if (!path.existsSync(targetDirectory)) {
        exports.mkdirS(targetDirectory);
    }

    var files = fs.readdirSync(srcDirectory);

    files.forEach(function(filename) {
        var stat = fs.statSync(path.join(srcDirectory, filename));

        if (stat.isFile()) {
            exports.copyFileSync(srcDirectory, targetDirectory, filename);
        } else if (stat.isDirectory()) {
            var fileDir = path.join(targetDirectory, filename);
            !path.existsSync(fileDir) && fs.mkdirSync(fileDir);
            exports.copyDirSync(path.join(srcDirectory, filename),
                path.join(targetDirectory, filename));
        }
    });
};

// 同步copy 文件.
exports.copyFileSync = function(srcDirectory, targetDirectory, filename) {
    var code = fs.readFileSync(path.join(srcDirectory, filename), 'utf8');
    fs.writeFileSync(path.join(targetDirectory, filename), code, 'utf8');
};

/**
 * convert `path/to/a` to `path/to/a/`
 * @param {String} p 相对路径.
 * @return {String} 返回规整好的路径.
 */
exports.normalizeEndSlash = function(p) {
    if (!/\/$/.test(p)) {
        p += '/';
    }
    return p;
};
