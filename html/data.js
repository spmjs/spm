define([
  {
    name: "SeaJS",
    desc: "A new kind of JavaScript loader.",
    tags: ["loader"],
    size: "3.2k",

    url: "http://seajs.com/",
    src: "http://seajs.com/build/sea-debug.js",
    min: "http://seajs.com/build/sea.js",

    version: "seajs.version"
  },

  {
    name: "Underscore",
    desc: "An utility-belt that provides functional programming support that you would expect in Ruby.",
    tags: ["functional", "language"],
    size: "3.0k",

    url: "http://documentcloud.github.com/underscore",
    src: "http://documentcloud.github.com/underscore/underscore.js",
    min: "http://documentcloud.github.com/underscore/underscore-min.js",

    before: "define('{{name}}', [], function(require, exports, module) {",
    after: "});",
    version: "_.VERSION"
  },

  {
    name: "Mustache",
    desc: "Minimal, logic-less templating with {{mustaches}}. Great for server- or client-side templating.",
    tags: ["templating"],
    size: "1.5k",

    url: "http://mustache.github.com/",
    src: "https://github.com/janl/mustache.js/raw/master/mustache.js",

    before: "define('{{name}}', [], function(require, exports, module) {",
    after: "module.exports = Mustache; });"
  },

  {
    name: "LABjs",
    desc: "Flexible JavaScript dependency loader.",
    tags: ["loader"],
    size: "2.1k",

    url: "http://labjs.com/",
    src: "https://github.com/getify/LABjs/raw/master/LAB.src.js",
    min: "https://github.com/getify/LABjs/raw/master/LAB.min.js",

    before: "define('{{name}}', [], function(require, exports, module) {",
    after: "module.exports = this.$LAB; try { delete this.$LAB; } catch(ex) { this.$LAB = undefined; } });"
  },

  {
    name: "FancyBox",
    desc: "FancyBox is a tool for displaying images, html content and multi-media in a Mac-style \"lightbox\" that floats overtop of web page. ",
    tags: ["jq-plugin"],
    size: "2.1k",

    url: "http://fancybox.net/",
    pkg: "http://fancybox.googlecode.com/files/jquery.fancybox-1.3.4.zip",
    src: "pkg://fancybox/jquery.fancybox-1.3.4.js",
    min: "pkg://fancybox/jquery.fancybox-1.3.4.pack.js",

    before: "define(function(require) { return function($) {",
    after: "}});",

    out: {
      // todo
    }
  }
]);
