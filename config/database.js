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

module.exports = db;
