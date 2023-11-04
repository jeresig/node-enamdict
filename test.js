var enamdict = require("./enamdict");

var start = (new Date).getTime();

enamdict.init(function() {
    var diff = (new Date).getTime() - start;
    //var data = enamdict.getData();
    //var keys = Object.keys(data);
    //console.log(keys);
    console.log("amano", enamdict.find("amano").type());
    console.log("kazami", enamdict.find("kazami").type());
    console.log("andoo", enamdict.find("andoo").type());
    console.log("ando", enamdict.find("ando").type());
    console.log("hiroshige", enamdict.find("hiroshige").type());
    console.log("sharaku", enamdict.find("sharaku"));
    console.log("tooshuusai", enamdict.find("tooshuusai").type());
    //console.log(keys.length);
    console.log(enamdict.find("andou").data);
    console.log(diff);
});

// enamdict.findKanji("安藤")

// To Test:
// Andoo Hiroshige
// Hiroshige Andoo
// Utagawa Hiroshige
// Hiroshige Utagawa
