/**
 * Utility for downloading the latest ENAMDICT, converting it to the right
 * encoding, re-formatting it, and outputting it to STDOUT.
 */
var enamdict = require("./enamdict");
var fs = require("fs");
var zlib = require("zlib");
var Stream = require("stream");
var request = require("request");
var Iconv = require("iconv").Iconv;

// The default URL where the enamdict file is located
var enamdictURL = "http://ftp.monash.edu.au/pub/nihongo/enamdict.gz";

// Download the ENMADICT database
var stream = request(enamdictURL)
    // Extract it...
    .pipe(zlib.createGunzip())
    // And make sure it's in UTF-8
    .pipe(new Iconv("EUC-JP", "UTF-8"));

// Load it into the enamdict module
enamdict.init(stream, function() {
    // And then convert it to the desired file format
    enamdict.process(function(err, data) {
        return console.log(data);
    });
});
