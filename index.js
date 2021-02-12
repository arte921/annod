const stationAfstandKilonet = require('./functies/stationAfstandKilonet.js');
const leesJSONSync = require('./functies/leesJSONSync.js');

const {
    tijdNaarMinutenGetal,
    minutenGetalNaarTijd
} = require('./functies/utility.js');

const {
    stationVertrekkenMoment
} = require('./functies/interpreters.js');

const config = leesJSONSync("config");
const vertrekken = leesJSONSync('vertrekken');
const stations = leesJSONSync('stations');

const startTijdMinuten = tijdNaarMinutenGetal(config.starttijd);
const eindTijdMinuten = startTijdMinuten - - config.speelduur_minuten;

const stationsNaam = (stationsCode) => stations.find((kandidaat) => stationsCode == kandidaat[1])[9];

let meesteAfstand = 0;

const berekenRitjes = (aankomstTijdMinuten, station, negeerbareFeaturesReferentie, huidigeAfstand, routeTotNuToe, routeDeltas, nietVolgen) => {
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
        const routeString = "afstand: " + (Math.round(huidigeAfstand * 10) / 10) + " km\n" + routeTotNuToe.map((deel, index) => [
            minutenGetalNaarTijd,
            stationsNaam,
            minutenGetalNaarTijd
        ][index % 3](deel)).join("\n") + "\n";
        
        if (meesteAfstand >= config.minimale_update_afstand) {
            console.log(routeString);
        }
    }

    // sort?
    let ritjes = stationVertrekkenMoment(station, vroegsteVertrektijd, laatsteVertrekTijd);
    let berekendeVertrekken = [];

    for (const rit of ritjes) {
        if (rit.richting == nietVolgen) continue;
        if (berekendeVertrekken.includes(rit.richting)) continue;
        berekendeVertrekken.push(rit.richting);

        let afstand = huidigeAfstand;
        
        const vertrekTijd = rit.verdererit[0].vertrektijd;

        let vorigeStation = station;
        for (const vertrek of rit.verdererit.slice(1)) {
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
                    rit.richting
                );
            }

            vorigeStation = vertrek.station;
        }
    }
};

console.log("==========BEGIN==========");

berekenRitjes(
    startTijdMinuten,
    config.start_station,
    [],
    0,
    [startTijdMinuten, config.start_station],
    [],
    ''
);