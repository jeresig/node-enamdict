/**
 * ENAMDICT Lookup Utility
 *   By John Resig http://ejohn.org/
 *   Released under an MIT License.
 */
var fs = require("fs");
var zlib = require("zlib");
var concat = require("concat-stream");

// Parse a line in the enamdict.
var lineRegex = /^([^ ]+) \[([^\]]+)\] \/(.*?)\//gm;

// Parse a line in the modified enamdict.
var modifiedLineRegex = /^([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)$/gm;

// Used for simplifying the romaji name to find close duplicates
var cleanRegex = /aa|ee|ii|oo|uu|ou|'/ig;

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

// The indexed positions of the names in the dictionary
var dataIndex;

module.exports = {
    // Default location of the included enamdict file
    enamdictFile: __dirname + "/enamdict.gz",

    init: function(stream, callback) {
        // Swap the arguments if the stream is left off
        if (!stream || typeof stream === "function") {
            callback = stream;
            stream = this.enamdictFile;
        }

        // If a stream is specified then we assume that we're dealing
        // with a gzip'd file of the ENAMDICT database
        if (typeof stream === "string") {
            stream = fs.createReadStream(stream).pipe(zlib.createGunzip());
        }

        callback = callback || function(){};

        if (Buffer.isBuffer(stream)) {
            // Convert the buffer into a string
            enamdictData = stream.toString();

            callback(null, this);

        } else {
            // Convert the file into one giant string to search through later
            stream.pipe(concat(function(data) {
                enamdictData = data.toString();
            }));

            stream.on("end", function() {
                this.index(callback);
            }.bind(this));
        }

        return stream;
    },

    process: function(callback) {
        var data = [];

        var match;
        while ((match = lineRegex.exec(enamdictData))) {
            var result = parseLine.apply(this, match);

            if (result) {
                data.push([
                    cleanName(result.romaji),
                    result.romaji,
                    result.kanji,
                    result.kana,
                    result.type
                ].join("|"));
            }
        }

        data = data.sort().join("\n");

        // Doesn't need to be a callback, but would rather be safe
        callback(null, data);
    },

    /**
     * Build an index to improve name lookup performance.
     */
    index: function(callback) {
        dataIndex = {};

        var pos = 0;

        enamdictData.split("\n").forEach(function(line) {
            var parts = line.split("|");
            var cleanName = parts[0];
            var romaji = parts[1];

            if (!(cleanName in dataIndex)) {
                dataIndex[cleanName] = pos;
            }

            if (!(romaji in dataIndex)) {
                dataIndex[romaji] = pos;
            }

            // +1 for the \n
            pos += line.length + 1;
        });

        callback(null, this);
    },

    find: function(romaji) {
        if (!romaji) {
            return null;
        }

        // Build Regex
        romaji = romaji.toLowerCase()
            // ENAMDICT uses ou for a long o by default
            .replace(/oo/g, "ou");

        var romajiRegex = romaji
            // We're going to look for both the regular and
            // long form of the vowels
            .replace(/([aeiu])/gi, "$1$1?")
            .replace(/o/gi, "o[ou]?")
            // We're also going to look for cases where n' could be used
            .replace(/n/g, "n'?");

        // Build the regex
        romajiRegex = new RegExp("^" + romajiRegex + "$", "i");

        var useIndex = false;

        if (dataIndex && romaji in dataIndex) {
            modifiedLineRegex.lastIndex = dataIndex[romaji];
            useIndex = true;
        }

        // Run the search
        return searchData(romajiRegex, "romaji", useIndex);
    },

    findKanji: function(kanji) {
        if (!kanji) {
            return null;
        }

        // Build the regex and run the search
        return searchData(new RegExp(kanji), "kanji");
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

var cleanName = function(name) {
    return name.replace(cleanRegex, function(all) {
        return all[0] === "'" ? "" : all[0];
    });
};

var searchData = function(regex, key, useIndex) {
    // Data cache
    var nameLookup = {};

    var match;
    while ((match = modifiedLineRegex.exec(enamdictData))) {
        var data = {
            romaji: match[2],
            kanji: match[3],
            kana: match[4],
            type: match[5]
        };

        var dataKey = data[key];

        if (!regex.test(dataKey)) {
            if (useIndex) {
                break;
            } else {
                continue;
            }
        }

        if (!nameLookup[dataKey]) {
            nameLookup[dataKey] = [data];
        } else {
            nameLookup[dataKey].push(data);
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
    var romaji = name.replace(/\s*\(.*?\)|,.*$/g, "").trim();

    // We don't want to get any names with whitespace or dashes in them
    if (/[\s-]/.test(romaji)) {
        return;
    }

    // Build an object of the data that we've extracted
    return {
        romaji: romaji.toLowerCase(),
        kanji: kanji,
        kana: kana,
        type: type
    };
};
