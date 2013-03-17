exports.name = 'spm';
exports.version = '0.1';

exports.filters = {
  linkfix: function(html) {
    return html.replace(/(href="\..*?)\.md"/g, '$1"');
  },

  directory: function(posts, dir) {
    var ret = Object.keys(posts).map(function(key) {
      return posts[key];
    }).filter(function(item) {
      return item.meta.directory === dir;
    }).sort(function(a, b) {
      var aIndex = parseInt(a.meta.index || 100, 10);
      var bIndex = parseInt(b.meta.index || 100, 10);
      return aIndex - bIndex;
    });
    return ret;
  }
};
