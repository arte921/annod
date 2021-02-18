const {
    splitRegels,
    splitEntries,
    tijdNaarMinutenGetal,
    haalEnkeleRegelOp
} = require('./functies/utility.js');

const {
    stopStations,
    vertrekTijd,
    ritVanafStation,
    rijdtOpDag
} = require('./functies/interpreters.js');

const schrijfJSONSync = require('./functies/schrijfJSONSync.js');
const leesIFFSync = require('./functies/leesIFFSync.js');
const leesJSONSync = require('./functies/leesJSONSync.js');
const coordinaatAfstand = require('./functies/coordinaatAfstand.js');

const kilonet = splitRegels(leesIFFSync("kilonetnew"));
const dienstregeling = leesIFFSync('timetbls').split("#").map((entry) => "#" + entry).slice(1);
const voetnoten = leesIFFSync('footnote').split("#").slice(1).map((entry) => splitRegels(entry)[1]);
const spoorkaart = leesJSONSync("spoorkaart").payload.features;

const config = leesJSONSync('config');

// 29676

const stations = splitRegels(leesIFFSync('stations'))
    .slice(1)
    .map(splitEntries)
    .filter((kandidaat) => kandidaat[4] == "NL");

const kilonetids = {};

kilonet.forEach((entry) => {
    const waarden = splitEntries(entry);
    const featureId = [waarden[0], waarden[1]].sort().join("-");
    kilonetids[featureId] = waarden[3] - 0 + 0.01 * waarden[4];
});

const afstandids = {};

spoorkaart.forEach((feature) => {
    const featureId = [feature.properties.to, feature.properties.from].sort().join("-");
    let afstand = 0;
    feature.geometry.coordinates.forEach((coordinaat, index) => {
        if (index > 1) afstand += coordinaatAfstand(coordinaat, feature.geometry.coordinates[index - 1])
    });
    afstandids[featureId] = afstand;
});

const vertrekken = {};

for (const rit of dienstregeling) {
    if (!config.toegestane_treintypen.includes(haalEnkeleRegelOp(rit, "&")[0])) continue;
    if (!rijdtOpDag(rit, config.dag)) continue;
    const stops = stopStations(rit);
    for (const station of stations) {
        const stationsCode = station[1];

        if (stops.includes(stationsCode)) {
            if (!vertrekken[stationsCode]) vertrekken[stationsCode] = [];
            vertrekken[stationsCode].push({
                rit: rit,
                vertrektijd: tijdNaarMinutenGetal(vertrekTijd(rit, stationsCode)),
                richting: haalEnkeleRegelOp(rit, "<")[0],
                verdererit: ritVanafStation(rit, stationsCode)
            });
        }
    }
}

schrijfJSONSync(vertrekken, 'vertrekken');
schrijfJSONSync(stations, 'stations');
schrijfJSONSync(dienstregeling, 'dienstregeling');
schrijfJSONSync(voetnoten, 'voetnoten');
schrijfJSONSync(afstandids, 'afstandids');
schrijfJSONSync(kilonetids, 'kilonetids');