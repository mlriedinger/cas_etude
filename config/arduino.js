// Variables de connexion à TheThingsNetwork (TTN)
const appID = "survivor";
const accessKey = "ttn-account-v2.8ojO0dV9Y-mOV60-Fmt0RLD7h6skH2o-hcwbWDVlNsI";

const ttn = require("ttn");
const arduino = new ttn.DataClient(appID, accessKey, 'eu.thethings.network:1883'); // Objet TTN pour envoyer des données à l'arduino

module.exports = arduino; 