define(function(require, exports, module) {
  var $ = require('gallery/jquery/1.8.2/jquery');
  $('.entry-content h2, .entry-content h3, .entry-content h4, .entry-content h5').each(function(index, item) {
    var $item = $(item);
    var link = [
      '<a class="title-permalink" title="Permalink to this title" href="#',
      $item.attr('id'),
      '">¶</a>'
    ].join('');
    $item.append(link);
  });
});
