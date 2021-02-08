// Dépendances Express
const express = require("express");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const ttn = require("ttn");

const app = express();

const router = require("./routes/routes.js");

//const db = require("./config/database.js");
const dbMethod = require("./model/model.js");

const appID = require("./config/appID.js");
const accessKey = require("./config/accessKey.js");

app.use(bodyParser.urlencoded({ extended: true}));
app.use(cookieParser());
app.use(router);

// On définit EJS comme moteur de visualisation pour rendre des vues
app.set('view engine', 'ejs');


/* ------------------------------------------------------------------------- */

// Réception des messages uplink de TTN
ttn.data(appID, accessKey).then(function(client) {
		client.on("uplink", function(devID, payload) {
			var data = []
			data[0] = payload['payload_fields']['Power']
			data[1] = payload['metadata']['time']
			data[2] = payload['dev_id']
			data[3] = payload['payload_fields']['Temp']
			console.log(data);
			
			if(data[0] > 0) dbMethod.insert(data);
				rempliMoi(data);
		});
}).catch(function(error) {
		console.error("Error", error)
		process.exit(1)
});

/* ------------------------------------------------------------------------- */

// Remplit la BDD avec des données random pour les autres panneaux
function rempliMoi(trackerValues) {

	var data = [];
	let up = Math.floor(Math.random() * 10);
	
	data[2] = 'Panneau_1';
	
	if(trackerValues[0] > 10) {
		data[0] = up > 5 ? trackerValues[0] + Math.floor(Math.random() * 10) : trackerValues[0] - Math.floor(Math.random() * 10);
		data[3] = up > 5 ? trackerValues[3] + Math.floor(Math.random() * 3) : trackerValues[3] - Math.floor(Math.random() * 3);
	} else {
		data[0] = trackerValues[0] + Math.floor(Math.random() * 10);
		data[3] = trackerValues[3] + Math.floor(Math.random() * 3);
	}

	dbMethod.insert(data);
	
	up = Math.floor(Math.random() * 10);
	data[2] = 'Panneau_2';

	if(trackerValues[0] > 10) {
		data[0] = up > 5 ? trackerValues[0] + Math.floor(Math.random() * 10) : trackerValues[0] - Math.floor(Math.random() * 10);
		data[3] = up > 5 ? trackerValues[3] + Math.floor(Math.random() * 3) : trackerValues[3] - Math.floor(Math.random() * 3);
	} else {
		data[0] = trackerValues[0] + Math.floor(Math.random() * 10);
		data[3] = trackerValues[3] + Math.floor(Math.random() * 3);
	}
	
	dbMethod.insert(data);
}

// Fonction qui flood la BDD en cas de besoin
function flood(nb) {	
	for(var i = 0; i < nb; i++) {
		rempliMoi();
	}
}

/* ------------------------------------------------------------------------- */

// Express écoute le port 8080
app.listen(8080);
