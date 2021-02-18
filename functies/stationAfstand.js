const leesJSONSync = require('./leesJSONSync.js');
const kilonetids = leesJSONSync("kilonetids");

module.exports = (station1, station2, negeerbareFeatures) => {
    const featureId = [station1, station2].sort().join("-");

    const afstand = kilonetids[featureId];

    if (negeerbareFeatures.includes(featureId)) return 0; /*{
        if (!config.dubbele_features.includes(featureId)) return 0;
        if (negeerbareFeatures.filter((feature) => config.dubbele_features.includes(feature)).length > 2) return 0;
    }*/

    negeerbareFeatures.push(featureId);

    return afstand;
};