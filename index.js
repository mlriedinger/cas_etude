// Dépendances

var ttn = require("ttn")

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

	var queryString = "insert into production(fk_panel_id, value, date) values((select id from panel where name ='"+data[2]+"'), "+data[0]+", now())";
	db.query(queryString);

}


// TTN :

var appID = "survivor"
var accessKey = "ttn-account-v2.8ojO0dV9Y-mOV60-Fmt0RLD7h6skH2o-hcwbWDVlNsI"

ttn.data(appID, accessKey).then(function(client) {
		client.on("uplink", function(devID, payload) {
			var data = []
			data[0] = payload['payload_fields']['Power']
			data[1] = payload['metadata']['time']
			data[2] = payload['dev_id']
			console.log(data)
			insert(data)
			rempliMoi();
			client.send(devID, "01", 1)
		})
}).catch(function(error) {
		console.error("Error", error)
		process.exit(1)
})



// Express :


app.get('/', function(req, res){
	res.sendFile('index.html');
	res.sendFile('main.js');
})

app.get('/api/panels', function(req, res){
	var data = db.query("SELECT name, location, SUM(value) AS total, date FROM production INNER JOIN panel ON production.fk_panel_id = panel.id GROUP BY name", function(err, result, fields) {
		if(err) throw err;
		res.send(result)
	})
})

app.get('/api/list', function(req, res) {
		var data = db.query("SELECT name FROM panel", function(err, result, fields) {
		if(err) throw err;
		res.send(result)
	})
})

app.get('/api/:name', function(req, res){
	var data = db.query("SELECT value, date FROM production INNER JOIN panel ON production.fk_panel_id = panel.id WHERE name = '" + req.params.name + "'", function(err, result, fields) {
		if(err) throw err;
		res.send(result)
	})
})


app.listen(8080)


// Remplir la BDD :

function rempliMoi() {

	var data = [];
	data[0] = Math.floor(Math.random() * 500);
	data[2] = 'Panneau 1';
	
	insert(data);
	
	data[2] = 'Panneau 2';
	data[0] = Math.floor(Math.random() * 200);
	
	insert(data);
	
}


function flood(nb) {
	
	console.log("Call me maybe !");
	
	for(var i = 0; i < nb; i++) {
		rempliMoi();
	}

}
