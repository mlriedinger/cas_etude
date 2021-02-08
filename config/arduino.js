const ttn = require("ttn");
const ttnConfig = require("./ttn.js");

const arduino = new ttn.DataClient(ttnConfig.appID, ttnConfig.accessKey, 'eu.thethings.network:1883'); // Objet TTN pour envoyer des données à l'arduino

module.exports = arduino; 