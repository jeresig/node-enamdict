/**
 * ENAMDICT Lookup Utility
 *   By John Resig http://ejohn.org/
 *   Released under an MIT License.
 */
var fs = require("fs");
var zlib = require("zlib");
var concat = require("concat-stream");

// Default location of the included enamdict file
var enamdictFile = __dirname + "/enamdict.gz";

// Parse a line in the enamdict.
var lineRegex = /^([^ ]+) \[([^\]]+)\] \/(.*?)\//;

// Used for extracting the type from a line
var typeEntryRegex = /\(([spugfmhrct,]+)\)/;

// Only parse lines that are of type: sugfm
// (surname, unknown, given, female given, male given)
var typeRegex = /\b([sugfm])\b/;

// Map of common types to expanded form
var types = {
    s: "surname",
    m: "given",
    f: "given",
    g: "given"
};

// Where we store the string form of the dictionary
var enamdictData = "";

module.exports = {
    init: function(stream, callback) {
        var self = this;

        // Swap the arguments if the stream is left off
        if (!stream || typeof stream === "function") {
            callback = stream;
            stream = enamdictFile;
        }

        // If a stream is specified then we assume that we're dealing
        // with a gzip'd file of the ENAMDICT database
        if (typeof stream === "string") {
            stream = fs.createReadStream(stream).pipe(zlib.createGunzip());
        }

        // Convert the file into one giant string to search through later
        stream.pipe(concat(function(data) {
            enamdictData = data.toString();
        }));

        stream.on("end", function() {
            if (callback) {
                callback(null, self);
            }
        });

        return stream;
    },

    find: function(romaji) {
        if (!romaji) {
            return null;
        }

        // Build Regex
        romaji = romaji
            // ENAMDICT uses ou for a long o by default
            .replace(/oo/g, "ou")
            // We're going to look for both the regular and
            // long form of the vowels
            .replace(/([aeiu])/gi, "$1$1?")
            .replace(/o/gi, "o[ou]?")
            // We're also going to look for cases where n' could be used
            .replace(/n/g, "n'?");

        // Build the regex
        var regex = new RegExp("^.*?/" + romaji + " .*?$", "igm");

        // Run the search
        return searchData(regex, "romaji");
    },

    findKanji: function(kanji) {
        if (!kanji) {
            return null;
        }

        // Build the regex and run the search
        return searchData(new RegExp("^" + kanji + ".*$", "gm"), "kanji");
    }
};

var Entries = function(data, key) {
    this.data = data;
    this.key = key;
};

Entries.prototype = {
    type: function() {
        return findPopular(this.data, "type", "unknown");
    },

    kana: function() {
        if (this.key === "romaji") {
            return findPopular(this.data, "kana", "");
        } else {
            return aggregate(this.data, this.type(), "kana");
        }
    },

    romaji: function() {
        if (this.key === "romaji") {
            return capitalize(findPopular(this.data, "romaji", ""));
        } else {
            return aggregate(this.data, this.type(), "romaji");
        }
    },

    kanji: function() {
        if (this.key === "kanji") {
            return findPopular(this.data, "kanji", "");
        } else {
            return aggregate(this.data, this.type(), "kanji");
        }
    },

    entries: function() {
        return this.data;
    }
};

var capitalize = function(name) {
    if (name) {
        return name[0].toUpperCase() + name.slice(1);
    }
    return "";
};

var aggregate = function(entries, type, key) {
    return entries.map(function(entry) {
        if (type === "unknown" ||
            entry.type === type ||
            entry.type === "unknown") {
                return entry[key];
        }
    }).filter(function(name) {
        return !!name;
    });
};

var findPopular = function(entries, key, _default) {
    var values = {};
    var total = 0;

    entries.forEach(function(entry) {
        if (key in entry) {
            values[entry[key]] = (values[entry[key]] || 0) + 1;
            total += 1;
        }
    });

    var popular = Object.keys(values).sort(function(a, b) {
        return values[b] - values[a];
    });

    if (popular.length > 0 && values[popular[0]] > total / 2) {
        return popular[0];
    }

    return _default;
};

var searchData = function(regex, key) {
    // Data cache
    var nameLookup = {};

    var match;
    while ((match = regex.exec(enamdictData))) {
        var line = match[0];
        if ((match = lineRegex.exec(line))) {
            var data = parseLine.apply(this, match);

            if (data) {
                var dataKey = data[key];

                if (!nameLookup[dataKey]) {
                    nameLookup[dataKey] = [data];
                } else {
                    nameLookup[dataKey].push(data);
                }
            }
        }
    }

    // Find the most popular variation of the name
    var popularName = Object.keys(nameLookup).sort(function(a, b) {
        return nameLookup[b].length - nameLookup[a].length;
    })[0];

    return popularName ?
        new Entries(nameLookup[popularName], key) :
        null;
};

var parseLine = function(line, kanji, kana, name) {
    // Make sure it has a type entry
    if (!typeEntryRegex.test(name)) {
        return;
    }

    // Make sure it actually has a type we care about
    if (!typeRegex.test(RegExp.$1)) {
        return;
    }

    // Store the type for later
    // TODO: Provide information on possible gender of name?
    var type = types[RegExp.$1] || "unknown";

    // Trim off extraneous information
    // Sometimes extra information is provided in quotes or after a comma
    var romaji = name.replace(/\s*\(.*?\)|,.*$/g, "");

    // Build an object of the data that we've extracted
    return {
        romaji: romaji,
        kanji: kanji,
        kana: kana,
        type: type
    };
};
