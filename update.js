const {
    splitRegels,
    splitEntries,
    tijdNaarMinutenGetal,
    haalEnkeleRegelOp
} = require('./functies/utility.js');

const {
    stopStations,
    vertrekTijd,
    ritVanafStation
} = require('./functies/interpreters.js');

const schrijfJSONSync = require('./functies/schrijfJSONSync.js');
const leesIFFSync = require('./functies/leesIFFSync.js');
const leesJSONSync = require('./functies/leesJSONSync.js');

const dienstregeling = leesIFFSync('timetbls').split("#").map((entry) => "#" + entry).slice(1);
const voetnoten = leesIFFSync('footnote').split("#").slice(1).map((entry) => splitRegels(entry)[1]);

const config = leesJSONSync('config');

// 29676

const stations = splitRegels(leesIFFSync('stations'))
    .slice(1)
    .map(splitEntries)
    .filter((kandidaat) => kandidaat[4] == "NL");

const vertrekken = {};

for (const rit of dienstregeling) {
    if (!config.toegestane_treintypen.includes(haalEnkeleRegelOp(rit, "&")[0])) continue;
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