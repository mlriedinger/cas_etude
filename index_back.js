var ttn = require("ttn")
const mysql = require('mysql')

const db = mysql.createConnection({
	host:"localhost",
	user: "root",
	password: "campus1234",
	database: "case_study_dev"
})

db.connect(function(err){
if(err) throw err;
console.log("Connecté à la BDD !");
})

function insert(data){
db.query("INSERT INTO production(fk_panel_id, value, date) VALUES(panel.id, data[0], data[1]) WHERE panel.name == data[2] INNER JOIN panel ON panel.id == production.fk_panel_id");
 
}

var appID = "survivor"
var accessKey = "ttn-account-v2.8ojO0dV9Y-mOV60-Fmt0RLD7h6skH2o-hcwbWDVlNsI"

ttn.data(appID, accessKey)
	.then(function(client) {
		client.on("uplink", function(devID, payload) {
			console.log("Received uplink from ", devID)
			console.log(payload)
			console.log("Test---------")
			console.log(payload['app_id'])
			console.log("nom " + payload['dev_id'])
			console.log("time " + payload['metadata']['time'])
			console.log(payload['payload_fields']['Power'])
			var data = []
			data[0] = payload['payload_fields']['Power']
			data[1] = payload['metadata']['time']
			data[2] = devID
			insert(data)
			client.send(devID, "01", 1)
		})
	})
	
	.catch(function(error) {
		console.error("Error", error)
		process.exit(1)
	})

