/**
 * Utility for downloading the latest ENAMDICT, converting it to the right
 * encoding, re-formatting it, and saving as a compressed file.
 */
var enamdict = require("./enamdict");
var fs = require("fs");
var zlib = require("zlib");
var Stream = require("stream");
var request = require("request");
var Iconv = require("iconv").Iconv;

// The default URL where the enamdict file is located
var enamdictURL = "http://ftp.monash.edu.au/pub/nihongo/enamdict.gz";

try {
    fs.statSync(enamdict.enamdictFile);
    process.exit(0);
} catch(e) {
    // If it doesn't exist then we need to download the dict
}

console.log("Downloading ENAMDICT...");

// Download the ENMADICT database
var stream = request(enamdictURL)
    // Extract it...
    .pipe(zlib.createGunzip())
    // And make sure it's in UTF-8
    .pipe(new Iconv("EUC-JP", "UTF-8"));

// Load it into the enamdict module
enamdict.init(stream, function() {
    console.log("Processing...");

    // And then convert it to the desired file format
    enamdict.process(function(err, data) {
        console.log("Outputting...");

        // Write out the result to a file!
        // Stick the string into the stream.
        var stream = new Stream();

        stream.pipe = function(dest) {
            dest.write(data);
            return dest;
        };

        stream
            // Make sure it's gzipped
            .pipe(zlib.createGzip())
            // Write it out to a file
            .pipe(fs.createWriteStream(enamdict.enamdictFile))
            .on("end", function() {
                console.log("DONE");
            });
    });
});
