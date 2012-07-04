/**
 * for node.exe in Windows OS
 * @param {String} filepath 文件路径.
 * @return {String} 规整好的文件路径.
 */
exports.normalizePath = function(filepath) {
    return filepath.replace(/\\/g, '/');
};
