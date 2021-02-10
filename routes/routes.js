// Import des dépendances
const express = require("express");
var path = require('path');

// Import des constantes et méthodes nécessaires au routage, aux requêtes SELECT en BDD et à l'envoi de messages à TTN
const router = express.Router();
const db = require("../config/database.js");
const arduino = require("../config/arduino.js");

// Page de connexion
router.get('/', function(req, res){
	res.render('index', {error: ''});
});

// Page d'accueil
router.get('/monitoring', function(req, res){
	console.log(req.cookies['Connexion']);
	if(req.cookies['Connexion'] > 0) {
		res.render('monitoring');
	} else res.render('index', {error: 'connexion'});
});

// Récupère et renvoie les données de connexion d'un utilisateur
router.post('/api/connexion/', function(req, res){
	//console.log(req.body);
	var data = db.query("SELECT login from users WHERE login='" + req.body.login + "' AND password='" + req.body.password +"'", function(err, result, fields){
		if(err) throw err;
		//console.log(result.length);
		if(result.length > 0) {
			res.cookie('Connexion', Math.random().toString());
			res.redirect('/monitoring');
		}
		else {
			res.render('index', {error: 'connexion'});
		}
	});
});

// Récupère et renvoie les données de production totale de tous les panneaux
router.get('/api/panels', function(req, res){
	var data = db.query("SELECT name, location, SUM(production) AS total, date, (SELECT temperature from data ORDER BY date DESC LIMIT 1) as temperature, pseudo FROM data INNER JOIN cabins ON data.fk_panel_id = cabins.id GROUP BY name", function(err, result, fields) {
		if(err) throw err;
		res.send(result);
	});
});

// Récupère et renvoie la liste des noms des panneaux
router.get('/api/list', function(req, res) {
	var data = db.query("SELECT name, pseudo, picture, description, location FROM cabins", function(err, result, fields) {
		if(err) throw err;
		res.send(result);
	});
});

// Récupère et renvoie les données de production d'un panneau au cours de la dernière heure écoulée
router.get('/api/:name', function(req, res){
	var data = db.query("SELECT production, date, pseudo FROM data INNER JOIN cabins ON data.fk_panel_id = cabins.id WHERE name = '" + req.params.name + "' AND date > ADDTIME((SELECT date FROM data ORDER BY date DESC LIMIT 1), '-1:00:00')", function(err, result, fields) {
		if(err) throw err;
		//console.log(result);
		res.send(result);
	});
});

// Envoie un message downlink à l'Arduino pour activer/désactiver la fonction tracker
router.get('/api/trackermode/:id', function(req, res) {
	arduino.send(req.params.id, "01", 1);
	console.log("Send trackermode to " + req.params.id);
	res.send("tracker mode set");
});

// Envoie un message downlink à l'Arduino pour activer/désactiver la fonction d'envoi de données
router.get('/api/sendmode/:id', function(req, res) {
	arduino.send(req.params.id, "02", 1);
	console.log("Send sendmode to " + req.params.id);
	res.send("send mode set");
});

// Envoie un message downlink à l'Arduino pour activer/désactiver la fonction chauffage
router.get('/api/heatingMode/:id', function(req, res) {
	arduino.send(req.params.id, "03", 1);
	console.log("Send heating mode to " + req.params.id);
	res.send("heating mode set");
});

// Envoie un message downlink à l'Arduino pour l'initialisation du panneau
router.get('/api/init/:id', function(req, res) {
	arduino.send(req.params.id, "04", 1);
	console.log("Send init to " + req.params.id);
	res.send("init set");
});

// Envoie un message downlink à l'Arduino pour modifier la température désirée
router.get('/api/settemp/:id/:value', function(req, res) {
	var nb = parseInt(req.params.value);
	arduino.send(req.params.id, "" + (nb.toString(16) > 16) ? nb.toString(16) : '0'+nb.toString(16) + "", 1);
	console.log("Send temp to " + req.params.id + " : " + nb.toString(16));
	res.send("temp set");
});

router.get('/main.js', function(req, res) {
	if(req.cookies['Connexion'] > 0) res.sendFile(path.resolve(__dirname + '/../controller/main.js'));
	else res.render('index', {error: 'connexion'});
});

router.get('/style.css', function(req, res) {
	res.sendFile(path.resolve(__dirname + '/../public/style.css'));
});

module.exports = router;
