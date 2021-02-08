const db = require("../config/database.js");

var methods = {};

// Insertion des données dans la BDD
methods.insert = function(data){
    var insertQuery = "insert into data(fk_panel_id, production, date, temperature) values((select id from cabins where name ='"+data[2]+"'), "+data[0]+", now(), " +data[3]+")";
	db.query(insertQuery);
}

// function insert(data){
// 	var insertQuery = "insert into data(fk_panel_id, production, date, temperature) values((select id from cabins where name ='"+data[2]+"'), "+data[0]+", now(), " +data[3]+")";
// 	db.query(insertQuery);
// }

module.exports = methods;