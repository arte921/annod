const {
    splitRegels,
    splitEntries,
    tijdNaarMinutenGetal
} = require('./functies/utility.js');

const {
    stopStations,
    vertrekTijd
} = require('./functies/interpreters.js');

const schrijfJSONSync = require('./functies/schrijfJSONSync.js');
const leesIFFSync = require('./functies/leesIFFSync.js');

const dienstregeling = leesIFFSync('timetbls').split("#").map((entry) => "#" + entry).slice(1);
const voetnoten = leesIFFSync('footnote').split("#").slice(1).map((entry) => splitRegels(entry)[1]);

// 29676

const stations = splitRegels(leesIFFSync('stations'))
    .slice(1)
    .map(splitEntries)
    .filter((kandidaat) => kandidaat[4] == "NL");

const vertrekken = {};

for (const rit of dienstregeling) {
    const stops = stopStations(rit);
    for (const station of stations) {
        const stationsCode = station[1];

        if (stops.includes(stationsCode)) {
            if (!vertrekken[stationsCode]) vertrekken[stationsCode] = [];
            vertrekken[stationsCode].push({
                rit: rit,
                vertrektijd: tijdNaarMinutenGetal(vertrekTijd(rit, stationsCode))
            });
        }
    }
}

schrijfJSONSync(vertrekken, 'vertrekken');
schrijfJSONSync(stations, 'stations');
schrijfJSONSync(dienstregeling, 'dienstregeling');
schrijfJSONSync(voetnoten, 'voetnoten');