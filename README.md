node-enamdict
=============

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