const { Worker, isMainThread, parentPort, threadId } = require('worker_threads');

const leesJSONSync = require('./functies/leesJSONSync.js');

const {
    tijdNaarMinutenGetal
} = require('./functies/utility.js');

const config = leesJSONSync("config");
const vertrekken = leesJSONSync('vertrekken');
const stations = leesJSONSync('stations');

const startTijdMinuten = tijdNaarMinutenGetal(config.starttijd);
const eindTijdMinuten = startTijdMinuten - - config.speelduur_minuten;

let meesteAfstand = 0;

let workers = [];
let lopendeThreads = 0;
let wachtrij = [[
    startTijdMinuten,
    config.start_station,
    [],
    0,
    [startTijdMinuten, config.start_station],
    [],
    ''
]];

const probeerOpdracht = () => {
    if (lopendeThreads >= config.threads) return;
    if (wachtrij.length == 0) return;

    const worker = new Worker("./worker.js");

    worker.onmessage = (data) => {
        if (data.type = 'nieuwbest') {
            meesteAfstand = data.inhoud;
        } else if (data.type == 'opdracht') {
            wachtrij.push(data.inhoud);
            probeerOpdracht();
        } else if (data.type == 'klaar') {
            lopendeThreads--;
            worker.terminate();
            delete worker;
        }
    };

    worker.postMessage({
        type: 'initialisatie',
        inhoud: {
            config,
            vertrekken,
            stations,
            startTijdMinuten,
            eindTijdMinuten
        }
    });

    const opdracht = wachtrij[wachtrij.length - 1];
    wachtrij.pop();

    worker.postMessage({
        type: 'opdracht',
        inhoud: opdracht
    })

    workers.push(worker);
}

console.log("==========BEGIN==========");
probeerOpdracht();