const {
    rijdtOpDag,
    ritStationsVolledig
} = require('./functies/interpreters.js');

const schrijfJSONSync = require('./functies/schrijfJSONSync.js');
const leesIFFSync = require('./functies/leesIFFSync.js');
const leesJSONSync = require('./functies/leesJSONSync.js');
const stationsLijstPolyline = require('./functies/stationsLijstPolyline.js');
const stations = leesJSONSync("stations");

const stationscodelijst = stations.map((station) => station.code);

const config = leesJSONSync('config');

const dienstregeling = leesIFFSync('timetbls')
    .split("#")
    .map((entry) => "#" + entry)
    .slice(1)
    .filter((rit) => rijdtOpDag(rit, config.dag))
    .map(ritStationsVolledig)
    .filter((rit) => rit.every((stop) => stationscodelijst.includes(stop.station)));


const alleritjes = [];

for (const rit of dienstregeling) {
    // console.log(rit.slice(0, 40));

    let i = 0;
    while (i + 1 < rit.length) {
        let offset = 1;
        while (!rit[i + offset].stopt) {
            offset++;
        }

        const stations = [...rit]
            .slice(i, i + offset + 1)
            .map((stop) => stop.station);

        alleritjes.push({
            vertrektijd: rit[i].vertrektijd,
            aankomsttijd: rit[i + offset].aankomsttijd,
            stations: stations,
            polyline: stationsLijstPolyline(stations)
        })

        i += offset;
    }
}

console.log(alleritjes.length);
console.log(dienstregeling.length);
console.log(alleritjes.length / dienstregeling.length + 1);
console.log(alleritjes[110]);

schrijfJSONSync(alleritjes, 'alleritjes');