define("test/lessModule/0.9.1/main-debug", [], function(require, exports, module) {
    var a = require("./colors-debug.css#");
    var b = require("./css3-debug.css#");
});

define("test/lessModule/0.9.1/colors.css", [], function() {
    function importStyle(cssText) {
        var element = document.createElement("style");
        doc.getElementsByTagName("head")[0].appendChild(element);
        if (element.styleSheet) {
            element.styleSheet.cssText = cssText;
        } else {
            element.appendChild(doc.createTextNode(cssText));
        }
    }
    importStyle("#yelow #short{color:#fea}#yelow #long{color:#fea}#yelow #rgba{color:rgba(255,238,170,.1)}#yelow #argb{color:#1affeeaa}#blue #short{color:#00f}#blue #long{color:#00f}#blue #rgba{color:rgba(0,0,255,.1)}#blue #argb{color:#1a0000ff}#alpha #hsla{color:rgba(61,45,41,.6)}#overflow .a{color:#000}#overflow .b{color:#fff}#overflow .c{color:#fff}#overflow .d{color:#0f0}#grey{color:#c8c8c8}#808080{color:#808080}#0f0{color:#0f0}.lightenblue{color:#33f}.darkenblue{color:#00c}.unknowncolors{color:blue2;border:2px solid superred}.transparent{color:transparent;background-color:rgba(0,0,0,0)}");
});

define("test/lessModule/0.9.1/css3.css", [], function() {
    function importStyle(cssText) {
        var element = document.createElement("style");
        doc.getElementsByTagName("head")[0].appendChild(element);
        if (element.styleSheet) {
            element.styleSheet.cssText = cssText;
        } else {
            element.appendChild(doc.createTextNode(cssText));
        }
    }
    importStyle('.comma-delimited{background:url(bg.jpg) no-repeat,url(bg.png) repeat-x top left,url(bg);text-shadow:-1px -1px 1px red,6px 5px 5px #ff0;-moz-box-shadow:0 0 2px rgba(255,255,255,.4) inset,0pt 4px 6px rgba(255,255,255,.4) inset}@font-face{font-family:Headline;src:local(Futura-Medium),url(fonts.svg#MyGeometricModern) format("svg")}.other{-moz-transform:translate(0,11em) rotate(-90deg);transform:rotateX(45deg)}p:not([class*="lead"]){color:#000}input[type="text"].class#id[attr=32]:not(1){color:#fff}div#id.class[a=1][b=2].class:not(1){color:#fff}ul.comma>li:not(:only-child)::after{color:#fff}ol.comma>li:nth-last-child(2)::after{color:#fff}li:nth-child(4n+1),li:nth-child(-5n),li:nth-child(-n+2){color:#fff}a[href^="http://"]{color:#000}a[href$="http://"]{color:#000}form[data-disabled]{color:#000}p::before{color:#000}#issue322{-webkit-animation:anim2 7s infinite ease-in-out}@-webkit-keyframes frames{0%{ border:1px}5.5%{border:2px}100%{border:3px}}@keyframes fontbulger1{to{ font-size:15px}from,to{font-size:12px}0,100%{font-size:12px}}');
});