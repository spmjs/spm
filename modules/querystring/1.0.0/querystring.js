define([], function(require, exports) {

/*
 QueryString v1.0.0
 https://lifesinger.github.com/querystring
 Copyright 2011, MIT Licensed.
*/
(function(){function l(a){var d=typeof a;return a==null||d!=="object"&&d!=="function"}var g;g=typeof exports!=="undefined"?exports:this.QueryString={};g.VERSION="1.0.0";var m=Object.prototype.toString,n=String.prototype.trim,o=Object.prototype.hasOwnProperty,p=Array.isArray?Array.isArray:function(a){return m.call(a)==="[object Array]"},k=n?function(a){return a==null?"":n.call(a)}:function(a){return a==null?"":a.toString().replace(/^\s+/,"").replace(/\s+$/,"")};g.escape=encodeURIComponent;g.unescape=
function(a){return decodeURIComponent(a.replace(/\+/g," "))};g.stringify=function(a,d,f,e){if(!a||!(m.call(a)==="[object Object]"&&"isPrototypeOf"in a))return"";d=d||"&";f=f||"=";e=e||!1;var h=[],c,b,i=g.escape;for(c in a)if(o.call(a,c))if(b=a[c],c=g.escape(c),l(b))h.push(c,f,i(b+""),d);else if(p(b)&&b.length)for(var j=0;j<b.length;j++)l(b[j])&&h.push(c,(e?i("[]"):"")+f,i(b[j]+""),d);else h.push(c,f,d);h.pop();return h.join("")};g.parse=function(a,d,f){var e={};if(typeof a!=="string"||k(a).length===
0)return e;a=a.split(d||"&");f=f||"=";d=g.unescape;for(var h=0;h<a.length;h++){var c=a[h].split(f),b=d(k(c[0]));c=d(k(c.slice(1).join(f)));var i=b.match(/^(\w+)\[\]$/);i&&i[1]&&(b=i[1]);o.call(e,b)?(p(e[b])||(e[b]=[e[b]]),e[b].push(c)):e[b]=i?[c]:c}return e}})();

});
