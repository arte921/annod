const {
    rijdtOpDag,
    ritStationsVolledig
} = require('./functies/interpreters.js');

const schrijfJSONSync = require('./functies/schrijfJSONSync.js');
const leesIFFSync = require('./functies/leesIFFSync.js');
const leesJSONSync = require('./functies/leesJSONSync.js');
const stationsLijstPolyline = require('./functies/stationsLijstPolyline.js');
const coordinaatAfstand = require('./functies/coordinaatAfstand.js');
const polylineAfstand = require('./functies/polylineAfstand.js');

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
    let i = 0;
    while (i + 1 < rit.length) {
        let offset = 1;
        while (!rit[i + offset].stopt) {
            offset++;
        }

        const vertrektijd = rit[i].vertrektijd;
        const aankomsttijd = rit[i + offset].aankomsttijd;

        const stations = [...rit]
            .slice(i, i + offset + 1)
            .map((stop) => stop.station);
        
        const polyline = stationsLijstPolyline(stations);
        const totaleafstand = polylineAfstand(polyline);
        const snelheid = totaleafstand / (aankomsttijd - vertrektijd); // kilometer per minuut

        let hoogte = vertrektijd;
        const lijn = [{
            lat: polyline[0].lat,
            lng: polyline[0].lng,
            hoogte: hoogte
        }];

        for (let j = 1; j < polyline.length; j++) {
            hoogte += coordinaatAfstand(polyline[j], polyline[j - 1]) * snelheid;
            lijn.push({
                lat: polyline[j].lat,
                lng: polyline[j].lng,
                hoogte: hoogte
            });
        }

        alleritjes.push({
            vertrektijd: vertrektijd,
            aankomsttijd: aankomsttijd,
            stations: stations,
            lijn: lijn
        });

        i += offset;
    }
}

console.log(alleritjes.length);
console.log(dienstregeling.length);
console.log(alleritjes.length / dienstregeling.length + 1);
console.log(alleritjes[1146]);

schrijfJSONSync(alleritjes, 'alleritjes');