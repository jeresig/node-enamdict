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

## Methods

### `.init(callback)`

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