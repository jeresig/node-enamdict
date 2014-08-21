node-enamdict
=============

A module for efficiently querying name records from [ENAMDICT](http://www.csse.monash.edu.au/~jwb/enamdict_doc.html) (A Japanese-English mapping of proper names). Specifically this module is designed for the use case of finding a good English/Kana/Kanji mapping for given names and surnames. Finding these mappings can be especially challenging and ENAMDICT appears to have the best available mapping. At this time all other entries in ENAMDICT are ignored (such as place names, full names, company names, etc.).

This utility was created to correct artist names in the [`romaji-name`](https://www.npmjs.org/package/romaji-name) library, which is used in the [Ukiyo-e.org](http://ukiyo-e.org/) service, created by [John Resig](http://ejohn.org/). All code is available under an MIT license.

## Example Usage:

    var enamdict = require("./enamdict");
    
    enamdict.init(function() {
        var entries = enamdict.find("utagawa");
        console.log("Romaji:", entries.romaji());
        console.log("Kana:", entries.kana());
        console.log("Kanji:", entries.kanji());
        console.log("Type:", entries.type());
        
        entries = enamdict.findKanji("曷川")
        console.log("Romaji:", entries.romaji());
        console.log("Kana:", entries.kana());
        console.log("Kanji:", entries.kanji());
        console.log("Type:", entries.type());
    });

**Sample Output:**

    # From `find()`
    Romaji: Utagawa
    Kana: うたがわ
    Kanji: [ '哥川', '唄川', '宇多川', '宇田川', '歌川', '詩川', '雅楽川' ]
    Type: surname

    # From `findKanji()`
    Romaji: [ 'katsugawa', 'katsukawa' ]
    Kana: [ 'かつがわ', 'かつかわ' ]
    Kanji: 曷川
    Type: surname

## Installation

This package can be installed by running:

    npm install enamdict

### ENAMDICT Pre-Processing

When this package is installed a copy of ENAMDICT is downloaded from: (http://ftp.monash.edu.au/pub/nihongo/enamdict.gz)[http://ftp.monash.edu.au/pub/nihongo/enamdict.gz]. A couple optimizations are performed in order to speed up search time and to decrease the file size of the dictionary.

* To start, ENAMDICT is converted from a EUC-JP encoding to the more-widely-used UTF-8 encoding.
* All entries that aren't "surname", "given", "male" (given), "female" (given), or "unknown" are removed.
* Extraneous non-name details are stripped from the entry (such as the years in which the individual lived).
* All entries that aren't an individual name part are removed. (e.g. "hiroshige" is kept but "utagawa hiroshige" is removed)
* Only the "romaji", "kana", "kanji", and "type" fields are preserved, everything else is removed.
* All the entries are then sorted by their romaji name (to improve lookup performance).

This is all placed into a new `enamdict.gz` file in the same directory as the `enamdict.js` script itself. For comparison the old ENAMDICT file is 7.2MB whereas the new one is only 2.8MB.

## Methods

### `.init(callback)`

Asynchronously loads the previously-generated reduced ENAMDICT.

### `.find(romajiName)`

### `.findKanji(kanjiName)`

## Models

### `Entries`

The result object returned from the `.find()` and `.findKanji()` methods. Holds a collection of entries that are then used in aggregate.

#### `.entries()`

Properties:

* `romaji`:
* `kana`:
* `kanji`:
* `type`:

#### `.type()`

Returns: `"surname"`, `"given"`, or `"unknown"`.

#### `.kana()`
#### `.romaji()`
#### `.kanji()`