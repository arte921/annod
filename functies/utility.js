const splitRegels = (tekst) => tekst.split(/\r?\n/);
const stripSpaties = (tekst) => tekst.replace(/ +$/, "");
const splitEntries = (tekst) => tekst.split(',').map(stripSpaties);
const tijdNaarMinutenGetal = (tijd) => (60 * (tijd.substring(0, 2) - 0)) + (tijd.substring(2, 4) - 0);
const getalBeginNullen = (getal, totaleLengte = 2, teken = "0") => ("0".repeat(totaleLengte) + getal).slice(-totaleLengte);
const minutenGetalNaarTijd = (minuten) => getalBeginNullen(Math.floor(minuten / 60)) + getalBeginNullen(minuten % 60);
const haalEnkeleRegelOp = (rit, sleutel) => splitEntries(splitRegels(rit).find((regel) => regel.charAt(0) == sleutel).substring(1));

module.exports = {
    splitRegels,
    stripSpaties,
    splitEntries,
    tijdNaarMinutenGetal,
    minutenGetalNaarTijd,
    haalEnkeleRegelOp
}
