exports.name = 'spm';
exports.version = '0.1';

exports.filters = {
  linkfix: function(html) {
    return html.replace(/(href="\..*?)\.md"/g, '$1"');
  }
};
