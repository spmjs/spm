exports.name = 'spm';
exports.version = '0.1';

exports.filters = {
  linkfix: function(html) {
    return html.replace(/(href="\..*?)\.md"/g, '$1"');
  },

  directory: function(posts, dir) {
    posts = posts.filter(function(item) {
      return item.directory === dir;
    });
    return posts.sort(function(a, b) {
      var aIndex = parseInt(a.meta.index || 100, 10);
      var bIndex = parseInt(b.meta.index || 100, 10);
      return aIndex - bIndex;
    });
  }
};
