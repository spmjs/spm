var compress=require("./compress");
var sys=require("sys");
var posix=require("posix");

// Read in our test file
var data=posix.cat("filetest.js", encoding="binary").wait();
sys.puts("Got : "+data.length);

// Set output file
var fd = posix.open("filetest.js.gz", process.O_WRONLY | process.O_TRUNC | process.O_CREAT, 0644).wait();
sys.puts("Openned file");

// Create gzip stream
var gzip=new compress.Gzip;
gzip.init();

// Pump data to be compressed
gzdata=gzip.deflate(data, "binary");  // Do this as many times as required
sys.puts("Compressed size : "+gzdata.length);
posix.write(fd, gzdata, encoding="binary").wait();

// Get the last bit
gzlast=gzip.end();
sys.puts("Last bit : "+gzlast.length);
posix.write(fd, gzlast, encoding="binary").wait();
posix.close(fd).wait();
sys.puts("File closed");

// See if we can uncompress it ok
var gunzip=new compress.Gunzip;
gunzip.init();
var testdata = posix.cat("filetest.js.gz", encoding="binary").wait();
sys.puts("Test opened : "+testdata.length);
sys.puts(gunzip.inflate(testdata, "binary").length);
gunzip.end();






