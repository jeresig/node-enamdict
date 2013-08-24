/**
 * ENAMDICT Romaji Lookup Utility
 *   By John Resig http://ejohn.org/
 *   Released under an MIT License.
 */
var fs = require("fs");
var zlib = require("zlib");
var concat = require("concat-stream");

// Parse a line in the enamdict.
// Only parse lines that are of type: sugfm
// (surname, unknown, given, female given, male given)
var lineRegex = /^([^ ]+) \[([^\]]+)\] \/(.*?) \([^\)]*?\b([ugfms])\b[^\)]*?\).*$/gm;

// TODO: Improve ugfms regex to work at both the start and end of the name field

// Data cache
var byRomaji = {};

// TODO: Need to add a simplified lookup where all long vowels are reduced
// Use it as a backup when nothing else is found

module.exports = {
    init: function(stream, callback) {
        if (arguments.length === 1) {
            callback = stream;
            stream = "enamdict.gz";
        }

        // If a stream is specified then we assume that we're dealing
        // with a gzip'd file of the ENAMDICT database
        if (typeof stream === "string") {
            stream = fs.createReadStream(stream)
                .pipe(zlib.createGunzip());
        }

        stream.pipe(concat(parseData));
        stream.on("end", callback);
    },

    find: function(romaji) {
        romaji = romaji.toLowerCase();
        // TODO: Clean up accents, convert to oo, etc.?

        if (romaji in byRomaji) {
            return new Entries(byRomaji[romaji]);
        }
    },

    findByName: function(romaji) {
        var parts = romaji.split(/\s+/);
        var surname = parts[0];
        var given = parts[1];

        var surnameEntries = this.find(surname);
        var givenEntries = this.find(given);

        if (!givenEntries && !surnameEntries) {
            return;
        }

        // Fix cases where only one of the two names was found
        if (!givenEntries || !surnameEntries) {
            if (givenEntries) {
                var tmp = surnameEntries = new Entries([{
                    romaji: surname,
                    type: "unknown"
                }]);

                // Swap the names if they're in the wrong place
                if (givenEntries.type() === "surname") {
                    surnameEntries = givenEntries;
                    givenEntries = tmp;
                }

            } else {
                var tmp = givenEntries = new Entries([{
                    romaji: given,
                    type: "unknown"
                }]);

                // Swap the names if they're in the wrong place
                if (surnameEntries.type() === "given") {
                    givenEntries = surnameEntries;
                    surnameEntries = tmp;
                }
            }
        } else {
            // Fix the case where they names are reversed
            if ((surnameEntries.type() === "given" ||
                givenEntries.type() === "surname") &&
                surnameEntries.type() !== givenEntries.type()) {
                    var tmp = surnameEntries;
                    surnameEntries = givenEntries;
                    givenEntries = tmp;
            }
        }

        return new RomajiName(surnameEntries, givenEntries);
    }
};

var RomajiName = function(surname, given) {
    this._surname = surname;
    this._given = given;
};

RomajiName.prototype = {
    surname: function() {
        return this._surname;
    },

    given: function() {
        return this._given;
    },

    toString: function() {
        return this.romaji();
    },

    romaji: function() {
        return this.surname().romaji() + " " +
            this.given().romaji();
    },

    romajiModern: function() {
        return this.given().romaji() + " " +
            this.surname().romaji();
    },

    katakana: function() {
        var givenKata = this.given().katakana();
        var surnameKata = this.surname().katakana();

        if (givenKata && surnameKata) {
            return surnameKata + givenKata;
        }
    },

    kanji: function() {
        var givenKanji = this.given().kanji();
        var surnameKanji = this.surname().kanji();

        var kanjis = [];

        surnameKanji.forEach(function(surname) {
            givenKanji.forEach(function(given) {
                kanjis.push(surname + given);
            })
        });

        return kanjis;
    }
};

var Entries = function(data) {
    this.data = data;
};

Entries.prototype = {
    type: function() {
        return findPopular(this.data, "type", "unknown");
    },

    katakana: function() {
        return findPopular(this.data, "katakana", "");
    },

    romaji: function() {
        return capitalize(findPopular(this.data, "romaji", ""));
    },

    kanji: function() {
        var type = this.type();

        return this.data.map(function(entry) {
            if (type === "unknown" ||
                entry.type === type ||
                entry.type === "unknown") {
                    return entry.kanji;
            }
        }).filter(function(kanji) {
            return !!kanji;
        });
    },

    entries: function() {
        return this.data;
    }
};

var capitalize = function(name) {
    return name[0].toUpperCase() + name.slice(1);
};

var findPopular = function(entries, key, _default) {
    var values = {};
    var total = 0;

    entries.forEach(function(entry) {
        values[entry[key]] = (values[entry[key]] || 0) + 1;
        total += 1;
    });

    var popular = Object.keys(values).sort(function(a, b) {
        return values[b] - values[a];
    });

    if (values[popular[0]] > total / 2) {
        return popular[0];
    }

    return _default;
};

var parseData = function(data) {
    data = data.toString();

    var match;
    while ((match = lineRegex.exec(data))) {
        parseLine.apply(this, match);
    }
};

var parseLine = function(line, kanji, katakana, romaji, type) {
    // Trim off extraneous information
    romaji = romaji
        .toLowerCase()
        // Sometimes extra information is provided in quotes
        // Or after a comma
        .replace(/\s*\(.*?\)|,.*$/g, "")
        // For whatever reason sometimes ou is used instead of oo
        .replace("ou", "oo");

    // Figure out what type of name we're dealing with
    if (/[gfm]/.test(type)) {
        // TODO: Provide information on possible gender of name?
        type = "given";
    } else if (type.indexOf("s") >= 0) {
        type = "surname";
    } else {
        type = "unknown";
    }

    // Build an object of the data that we've extracted
    var data = {
        romaji: romaji,
        kanji: kanji,
        katakana: katakana,
        type: type
    };

    // Stuff into a hash for a fast lookup
    if (!byRomaji[romaji]) {
        byRomaji[romaji] = [data];
    } else {
        byRomaji[romaji].push(data);
    }
};
