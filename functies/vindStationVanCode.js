const leesJSONSync = require('./leesJSONSync.js');
const stations = leesJSONSync("stations").payload;

module.exports = (stationsNaam) => stations.find((kandidaatStation) => kandidaatStation.code == stationsNaam);