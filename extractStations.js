const leesIFFSync = require('./functies/leesIFFSync.js');
const {
    splitRegels,
    splitEntries
} = require('./functies/utility.js');

console.log(
    splitRegels(leesIFFSync("stations"))
        .slice(1)
        .map(splitEntries)
        .filter((e) => e[4] === "NL")
        .map((e) => `${e[1] + " ".repeat(6 - e[1].length)} ${e[9]}`)
        .join("\n")
);
