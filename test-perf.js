var enamdict = require("./enamdict");

var search = function() {
    console.time("find");
    var name;
    for (var i = 0; i < 10; i++) {
        name = enamdict.find("Utagawa");
        name = enamdict.find("Hiroshige");
    }
    console.timeEnd("find");
    if (name) {
        console.log(name.kana());
    } else {
        console.log("ERROR: Name not found.");
    }
};

enamdict.init(function() {
    search();
});
