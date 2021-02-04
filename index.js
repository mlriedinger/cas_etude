// Dépendances Express
const express = require("express");
const app = express();
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');


// On sert l'intégralité du dossier "public" avec Express
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true}));
app.use(cookieParser());

/* ------------------------------------------------------------------------- */

// Connexion à la BDD
const mysql = require('mysql');
const db = mysql.createConnection({
	host:"localhost",
	user: "mlo",
	password: "campus1234",
	database: "case_study_dev",
	insecureAuth: true
});
db.connect(function(err){
	if(err) throw err;
	console.log("Connecté à la BDD !");
});

// Insertion des données dans la BDD
function insert(data){
	var insertQuery = "insert into data(fk_panel_id, production, date, temperature) values((select id from cabins where name ='"+data[2]+"'), "+data[0]+", now(), " +data[3]+")";
	db.query(insertQuery);
}

/* ------------------------------------------------------------------------- */

// Variables de connexion à TheThingsNetwork (TTN)
const appID = "survivor";
const accessKey = "ttn-account-v2.8ojO0dV9Y-mOV60-Fmt0RLD7h6skH2o-hcwbWDVlNsI";

// Connexion à TheThingsNetwork (TTN)
const ttn = require("ttn");
const arduino = new ttn.DataClient(appID, accessKey, 'eu.thethings.network:1883'); // Objet TTN pour envoyer des données à l'arduino

// Réception des messages uplink de TTN
ttn.data(appID, accessKey).then(function(client) {
		client.on("uplink", function(devID, payload) {
			var data = []
			data[0] = payload['payload_fields']['Power']
			data[1] = payload['metadata']['time']
			data[2] = payload['dev_id']
			data[3] = payload['payload_fields']['Temp']
			console.log(data);
			
			if(data[0] > 0) insert(data);
				rempliMoi(data);
		});
}).catch(function(error) {
		console.error("Error", error)
		process.exit(1)
});

/* ------------------------------------------------------------------------- */

// Routes

// Page de connexion
app.get('/', function(req, res){
	res.sendFile('index.html');
	res.sendFile('connexion.js');
});

// Page d'accueil
app.get('/monitoring', function(req, res){
	console.log("mlo\n\n\n");
	console.log(req.cookies['Connexion']);
	if(req.cookies['Connexion'] > 0) {
		app.use(express.static('private'));
		res.sendFile(__dirname + '/private/monitoring.html');
		//res.sendFile(__dirname + '/private/main.js');
		//res.sendFile(__dirname + '/private/style.css');
	} else res.redirect('../../index.html?error');
});

// Récupère et renvoie les données de connexion d'un utilisateur
app.post('/api/connexion/', function(req, res){
	//console.log(req.body);
	var data = db.query("SELECT login from users WHERE login='" + req.body.login + "' AND password='" + req.body.password +"'", function(err, result, fields){
		if(err) throw err;
		console.log(result.length);
		if(result.length > 0) {
			res.cookie('Connexion', Math.random().toString());
			res.redirect('/monitoring');
		}
		else {
			res.redirect('../../index.html?error');
		}
	});
});

// Récupère et renvoie les données de production totale de tous les panneaux
app.get('/api/panels', function(req, res){
	var data = db.query("SELECT name, location, SUM(production) AS total, date, temperature, pseudo FROM data INNER JOIN cabins ON data.fk_panel_id = cabins.id GROUP BY name", function(err, result, fields) {
	if(err) throw err;
	res.send(result);
	});
});

// Récupère et renvoie la liste des noms des panneaux
app.get('/api/list', function(req, res) {
	var data = db.query("SELECT name, pseudo, picture, description, location FROM cabins", function(err, result, fields) {
	if(err) throw err;
	res.send(result);
	});
});

// Récupère et renvoie les données de production d'un panneau au cours de la dernière heure écoulée
app.get('/api/:name', function(req, res){
	var data = db.query("SELECT production, date, pseudo FROM data INNER JOIN cabins ON data.fk_panel_id = cabins.id WHERE name = '" + req.params.name + "' AND date > ADDTIME((SELECT date FROM data ORDER BY date DESC LIMIT 1), '-1:00:00')", function(err, result, fields) {
	if(err) throw err;
	//console.log(result);
	res.send(result);
	});
});

// Envoie un message downlink à l'Arduino pour activer/désactiver la fonction tracker
app.get('/api/trackermode/:id', function(req, res) {
	
	arduino.send(req.params.id, "01", 1);
	console.log("Send trackermode to " + req.params.id);
	res.send("tracker mode set");
});

// Envoie un message downlink à l'Arduino pour activer/désactiver la fonction d'envoi de données
app.get('/api/sendmode/:id', function(req, res) {
	arduino.send(req.params.id, "02", 1);
	console.log("Send sendmode to " + req.params.id);
	res.send("send mode set");
});

// Envoie un message downlink à l'Arduino pour activer/désactiver la fonction chauffage
app.get('/api/heatingMode/:id', function(req, res) {
	arduino.send(req.params.id, "03", 1);
	console.log("Send heating mode to " + req.params.id);
	res.send("heating mode set");
});

// Envoie un message downlink à l'Arduino pour modifier la température désirée
app.get('/api/settemp/:id/:value', function(req, res) {
	var nb = parseInt(req.params.value);
	arduino.send(req.params.id, "" + nb.toString(16) > 16 ? nb.toString(16) : '0'+nb.toString(16) + "", 1);
	console.log("Send temp to " + req.params.id + " : " + nb.toString(16));
	res.send("temp set");
});

/* ------------------------------------------------------------------------- */

// Express écoute le port 8080
app.listen(8080);

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

	insert(data);
	
	up = Math.floor(Math.random() * 10);
	data[2] = 'Panneau_2';

	if(trackerValues[0] > 10) {
		data[0] = up > 5 ? trackerValues[0] + Math.floor(Math.random() * 10) : trackerValues[0] - Math.floor(Math.random() * 10);
		data[3] = up > 5 ? trackerValues[3] + Math.floor(Math.random() * 3) : trackerValues[3] - Math.floor(Math.random() * 3);
	} else {
		data[0] = trackerValues[0] + Math.floor(Math.random() * 10);
		data[3] = trackerValues[3] + Math.floor(Math.random() * 3);
	}
	
	insert(data);
}

// Fonction qui flood la BDD en cas de besoin
function flood(nb) {	
	for(var i = 0; i < nb; i++) {
		rempliMoi();
	}
}
