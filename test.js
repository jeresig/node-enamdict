var enamdict = require("./enamdict");

var start = (new Date).getTime();

enamdict.init(function() {
    var diff = (new Date).getTime() - start;
    //var data = enamdict.getData();
    //var keys = Object.keys(data);
    //console.log(keys);
    //console.log("amano", enamdict.lookup("amano").type());
    //console.log("kazami", enamdict.lookup("kazami").type());
    //console.log("andoo", enamdict.lookup("andoo").type());
    //console.log("ando", enamdict.lookup("ando").type());
    //console.log("hiroshige", enamdict.lookup("hiroshige").type());
    //console.log("sharaku", enamdict.lookup("sharaku"));
    //console.log("tooshuusai", enamdict.lookup("tooshuusai").type());
    //console.log(keys.length);
    console.log(enamdict.find("andou").data);
    console.log(diff);
});

// enamdict.lookupKanji("安藤")

// To Test:
// Andoo Hiroshige
// Hiroshige Andoo
// Utagawa Hiroshige
// Hiroshige Utagawa
