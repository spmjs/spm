var compress=require("./compress");
var sys=require("sys");
var posix=require("posix");

// Create gzip stream
var gzip=new compress.Gzip;
gzip.init();

// Pump data to be compressed
var gzdata1 = gzip.deflate("My data that needs ", "binary"); 
sys.puts("Compressed size : "+gzdata1.length);

var gzdata2 = gzip.deflate("to be compressed. 01234567890.", "binary"); 
sys.puts("Compressed size : "+gzdata2.length);

var gzdata3=gzip.end();
sys.puts("Last bit : "+gzdata3.length);

// Take the output stream, and chop it up into two
var gzdata = gzdata1+gzdata2+gzdata3;
sys.puts("Total compressed size : "+gzdata.length);
var d1 = gzdata.substr(0, 25);
var d2 = gzdata.substr(25);

// Create gunzip stream to decode these
var gunzip = new compress.Gunzip;
gunzip.init();
var data1 = gunzip.inflate(d1, "binary");
var data2 = gunzip.inflate(d2, "binary");
var data3 = gunzip.end();

sys.puts(data1+data2+data3);






