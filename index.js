const stationAfstandKilonet = require('./functies/stationAfstandKilonet.js');
const leesJSONSync = require('./functies/leesJSONSync.js');
const leesIFFSync = require('./functies/leesIFFSync.js');

const {
    splitRegels,
    splitEntries,
    tijdNaarMinutenGetal,
    minutenGetalNaarTijd,
    haalEnkeleRegelOp
} = require('./functies/utility.js');

const {
    stopStations,
    ritVanafStation,
    vertrekTijd,
    stationVertrekkenMoment
} = require('./functies/interpreters.js');

const config = leesJSONSync("config");

const startTijdMinuten = tijdNaarMinutenGetal(config.starttijd);
const eindTijdMinuten = startTijdMinuten + config.speelduur_minuten;

const dienstregeling = leesIFFSync('timetbls').split("#").map((entry) => "#" + entry).slice(1);
const voetnoten = leesIFFSync('footnote').split("#").slice(1).map((entry) => splitRegels(entry)[1]);

// console.log(dienstregeling[29676]);
// console.log(rijdtOpDag(dienstregeling[29676], config.dag));

const stations = splitRegels(leesIFFSync('stations'))
    .slice(1)
    .map(splitEntries)
    .filter((kandidaat) => kandidaat[4] == "NL");

const stationsNaam = (stationsCode) => stations.find((kandidaat) => stationsCode == kandidaat[1])[9];

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

let kandidaatRoutes = [];
let meesteAfstand = 0;

const berekenRitjes = (aankomstTijdMinuten, station, negeerbareFeaturesReferentie, huidigeAfstand, routeTotNuToe, routeDeltas, nietVolgen) => {
    // console.log(aankomstTijdMinuten, station, negeerbareFeaturesReferentie, huidigeAfstand, routeTotNuToe, routeDeltas, nietVolgen);
    const vroegsteVertrektijd = aankomstTijdMinuten + config.minimum_overstaptijd_minuten;

    // check of rit tot nu toe nog voldoet
    if (
        vroegsteVertrektijd > eindTijdMinuten
        || (
            routeDeltas.length > config.snelheidsmetingen_begin_ritjes &&
            huidigeAfstand / ((aankomstTijdMinuten - startTijdMinuten) / 60) < config.minimum_gemiddelde_snelheid
        ) || (
            routeDeltas.length > config.maximum_ritjes_stilstand &&
            routeDeltas.slice(- config.maximum_ritjes_stilstand - 1).reduce((a, b) => a + b) == 0
        ) || !vertrekken[station]
    ) return;

    const laatsteVertrekTijd = aankomstTijdMinuten + config.maximum_overstaptijd_minuten;
    let negeerbareFeatures = [...negeerbareFeaturesReferentie];

    if (huidigeAfstand > meesteAfstand) {
        meesteAfstand = huidigeAfstand;
        const routeString = routeTotNuToe.map((deel, index) => [
            minutenGetalNaarTijd,
            stationsNaam,
            minutenGetalNaarTijd
        ][index % 3](deel)).join("\n");
        
        console.log(huidigeAfstand, routeString);

        if (meesteAfstand >= config.minimale_update_afstand) {
            kandidaatRoutes.push({
                afstand: huidigeAfstand,
                route: routeString
            });
            schrijfRoutes();
        }
    }

    // sort?
    let ritjes = stationVertrekkenMoment(station, vroegsteVertrektijd, laatsteVertrekTijd);
    let berekendeVertrekken = [];

    for (const rit of ritjes) {
        if (!config.toegestane_treintypen.includes(haalEnkeleRegelOp(rit, "&")[0])) continue;
        const richting = haalEnkeleRegelOp(rit, "<")[0];
        if (richting == nietVolgen) continue;
        if (berekendeVertrekken.includes(richting)) continue;
        berekendeVertrekken.push(richting);

        let afstand = huidigeAfstand;
        
        const verdereRit = ritVanafStation(rit, station);
        const vertrekTijd = verdereRit[0].vertrektijd;
        // console.log(verdereRit);

        let vorigeStation = station;
        for (const vertrek of verdereRit.slice(1)) {
            afstand += stationAfstandKilonet(vorigeStation, vertrek.station, negeerbareFeatures);

            // er wordt op het station gestopt
            if (vertrek.stopt) {
                berekenRitjes(
                    vertrek.aankomsttijd,
                    vertrek.station,
                    negeerbareFeatures,
                    afstand,
                    [...routeTotNuToe, vertrekTijd, vertrek.aankomsttijd, vertrek.station],
                    [...routeDeltas, afstand - huidigeAfstand],
                    richting
                );
            }

            vorigeStation = vertrek.station;
        }
    }
};

console.log("begin");

berekenRitjes(
    startTijdMinuten,
    config.start_station,
    [],
    0,
    [startTijdMinuten, config.start_station],
    [],
    ''
);


const schrijfRoutes = async () => {
    kandidaatRoutes.sort((a, b) => b.afstand - a.afstand);
    await writeJSON(kandidaatRoutes, 'resultaat');
}
