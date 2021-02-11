const leesJSONSync = require('./leesJSONSync.js');
const config = leesJSONSync("config");

const {
    splitRegels,
    splitEntries
} = require('./utility.js');

const leesIFFSync = require('./leesIFFSync.js');
const kilonet = splitRegels(leesIFFSync("kilonetnew")).map(splitEntries);

module.exports = (station1, station2, negeerbareFeatures) => {
    const station1KleineLetters = station1.toLowerCase();
    const station2KleineLetters = station2.toLowerCase();

    const afstandEntry = kilonet.find((entry) => entry.includes(station1KleineLetters) && entry.includes(station2KleineLetters));
    if (!afstandEntry) return 0;
    const afstand = afstandEntry[3] - 0 + 0.01 * afstandEntry[4];

    const featureId = [station1KleineLetters, station2KleineLetters].sort().join("-");

    if (negeerbareFeatures.includes(featureId)) {
        if (!config.dubbele_features.includes(featureId)) return 0;
        if (negeerbareFeatures.filter((feature) => config.dubbele_features.includes(feature)).length > 2) return 0;
    }

    return afstand;
};