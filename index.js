const stationAfstand = require('./functies/stationAfstand.js');
const leesJSONSync = require('./functies/leesJSONSync.js');

const {
    tijdNaarMinutenGetal,
    minutenGetalNaarTijd
} = require('./functies/utility.js');

const {
    stationVertrekkenMoment,
    stationsNaam
} = require('./functies/interpreters.js');

const config = leesJSONSync("config");
const vertrekken = leesJSONSync('vertrekken');

const startTijdMinuten = tijdNaarMinutenGetal(config.starttijd);
const eindTijdMinuten = startTijdMinuten - - config.speelduur_minuten;

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
                
        if (meesteAfstand >= config.minimale_update_afstand) {
            console.log("afstand: " + (Math.round(huidigeAfstand * 10) / 10) + " km\n" + routeTotNuToe.map((deel, index) => [
                minutenGetalNaarTijd,
                stationsNaam,
                minutenGetalNaarTijd
            ][index % 3](deel)).join("\n") + "\n");
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
            afstand += stationAfstand(vorigeStation, vertrek.station, negeerbareFeatures);

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