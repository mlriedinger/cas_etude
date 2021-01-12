// Dépendances

const mysql = require('mysql')


var express = require("express")
var app = express()

app.use(express.static('public'));


// Connexion à la BDD

const db = mysql.createConnection({
	host:"localhost",
	user: "mlo",
	password: "campus1234",
	database: "case_study_dev",
	insecureAuth: true
})

db.connect(function(err){
	if(err) throw err;
	console.log("Connecté à la BDD !");
})

// Insertion de données dans la BDD

function insert(data){

	var queryString = "insert into data(fk_panel_id, production, date, temperature) values((select id from cabins where name ='"+data[2]+"'), "+data[0]+", now(), " +data[3]+")";
	db.query(queryString);

}

// TTN :

const appID = "survivor"
const accessKey = "ttn-account-v2.8ojO0dV9Y-mOV60-Fmt0RLD7h6skH2o-hcwbWDVlNsI"

const ttn = require("ttn")
const arduino = new ttn.DataClient(appID, accessKey, 'eu.thethings.network:1883'); // Objet TTN pour envoyer des données à l'arduino

ttn.data(appID, accessKey).then(function(client) {
		client.on("uplink", function(devID, payload) {
			var data = []
			data[0] = payload['payload_fields']['Power']
			data[1] = payload['metadata']['time']
			data[2] = payload['dev_id']
			data[3] = payload['payload_fields']['Temp']
			console.log(data)
			insert(data)
			rempliMoi();
		})
}).catch(function(error) {
		console.error("Error", error)
		process.exit(1)
})



// Routes :


app.get('/', function(req, res){
	res.sendFile('index.html');
	res.sendFile('main.js');
})

app.get('/api/panels', function(req, res){
	var data = db.query("SELECT name, location, SUM(production) AS total, date FROM data INNER JOIN cabins ON data.fk_panel_id = cabins.id GROUP BY name", function(err, result, fields) {
		if(err) throw err;
		res.send(result)
	})
})

app.get('/api/list', function(req, res) {
		var data = db.query("SELECT name FROM cabins", function(err, result, fields) {
		if(err) throw err;
		res.send(result)
	})
})

app.get('/api/:name', function(req, res){
	var data = db.query("SELECT production, date FROM data INNER JOIN cabins ON data.fk_panel_id = cabins.id WHERE name = '" + req.params.name + "'", function(err, result, fields) {
		if(err) throw err;
		res.send(result)
	})
})

app.get('/api/trackermode/:id', function(req, res) {
	arduino.send(req.params.id, "01", 1);
	console.log("Send trackermode to " + req.params.id);
	res.send("tracker mode set");
})

app.get('/api/sendmode/:id', function(req, res) {
	arduino.send(req.params.id, "02", 1);
	console.log("Send sendmode to " + req.params.id);
	res.send("send mode set");
})

app.get('/api/powermode/:id', function(req, res) {
	arduino.send(req.params.id, "03", 1);
	console.log("Send powermode to " + req.params.id);
	res.send("power mode set");
})

app.get('/api/settemp/:id/:value', function(req, res) {
	var nb = parseInt(req.params.value);
	arduino.send(req.params.id, "" + nb.toString(16) + "", 1);
	console.log("Send temp to " + req.params.id + " : " + nb);
	res.send("temp set");
});

app.listen(8080)


// Remplir la BDD :

function rempliMoi() {

	var data = [];
	
	data[2] = 'Panneau_1';
	data[0] = Math.floor(Math.random() * 254);
	data[3] = Math.floor(Math.random() * 25);
	
	insert(data);
	
	data[2] = 'Panneau_2';
	data[0] = Math.floor(Math.random() * 254);
	data[3] = Math.floor(Math.random() * 25);
	
	insert(data);
	
}


function flood(nb) {
	
	console.log("Call me maybe !");
	
	for(var i = 0; i < nb; i++) {
		rempliMoi();
	}

}
