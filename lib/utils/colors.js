// colors.js for node console by lifesinger@gmail.com

const STYLES = {
  //styles
  'bold'      : [1,  22],
  'italic'    : [3,  23],
  'underline' : [4,  24],
  'inverse'   : [7,  27],
  //grayscale
  'white'     : [37, 39],
  'grey'      : [90, 39],
  'black'     : [90, 39],
  //colors
  'blue'      : [34, 39],
  'cyan'      : [36, 39],
  'green'     : [32, 39],
  'magenta'   : [35, 39],
  'red'       : [31, 39],
  'yellow'    : [33, 39]
};


Object.keys(STYLES).forEach(function(style) {

  String.prototype.__defineGetter__(style, function () {
    return stylize(this, style);
  });

});

function stylize(str, style) {
  return '\033[' + STYLES[style][0] + 'm' + str +
      '\033[' + STYLES[style][1] + 'm';
}
