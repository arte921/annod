# annod
Tool om zo lang mogelijke reizen over het spoor te berekenen. Gebruikt een lokale kopie van de dienstregeling.

De dienstregeling moet in IFF formaat zijn. De Nederlandse dienstregeling is [hier](http://data.ndovloket.nl/ns/ns-latest.zip) te downloaden.

Om deze tool te gebruiken moet het bestand `opslag/config.json.example` worden hernoemd naar `opslag/config.json`.
Draai dan (en na de treintypen of de datum te veranderen in `config.js`) het `update.js` script in de root.

Nu kan de tool gebruikt worden. Stel parameters in in `opslag/config.json` en bereken routes door `index.js` te draaien.
