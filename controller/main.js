// Consomme l'API avec Axios pour récupérer les données de production totale des panneaux, puis les affiche sous forme de graphique
let dataPanels;
let temperature = [];

function getData() {
	axios.get('/api/panels').then(function(response) {
		// console.log(response['data'])
		var data = response['data'];
		for(let i = 0; i < data.length; i++) {
			temperature[i] = data[i].temperature;
		}
		drawChart('Production totale des panneaux', data);
	});
};


// Consomme l'API avec Axios pour récupérer les données de production d'un seul panneau, puis les affiche sous forme de graphique
function getDataPanel(name) {
	//console.log(name);
	axios.get('/api/'+name).then(function(response) {
		//console.log(response);
		drawChartPanel(response['data'][0]['pseudo'], response['data'])
	});
};


// Consomme l'API avec Axios pour récupérer les noms des panneaux, puis appelle la fonction qui affiche les boutons de commande
function getListPanel() {
	axios.get('/api/list').then(function(response) {
		//console.log(response['data'])
		dataPanels = response['data'];
		displayButtons();
	});
};

// Créé une <div> avec les boutons de commande pour chaque panneau
function displayButtons(){
	// console.log(dataPanels);
	
	for(var i = 0; i < dataPanels.length; i++) {
		var name = dataPanels[i].name;
		var pseudo = dataPanels[i].pseudo;
		var location = dataPanels[i].location;
		var picture = dataPanels[i].picture;
		var description = dataPanels[i].description;
		//console.log(picture);
		
		var divPanel = document.createElement("div");
		divPanel.classList.add("col");
		divPanel.classList.add("sm-6");
		
		//divPanel.innerHTML += "<div class='row'><button class='btn btn-dark mb-3 btn-sm' data-bs-toggle='modal' data-bs-target='#exampleModal' onclick='getDataPanel(\""+ name + "\")' data-bs-whatever='" + pseudo + "'>Production "+ pseudo + "</button></div>";
		//divPanel.innerHTML += "<p style='font-style: italic;'>"+ location + "</p>";
		//divPanel.innerHTML += "<button type='button' id='tracker_button_"+ name +"' class='btn btn-success mb-3 btn-sm' onclick='trackerMode(\""+ name + "\")'><i class='fas fa-solar-panel'></i></button>";
		//divPanel.innerHTML += "<button type='button' id='send_button_"+ name +"' class='btn btn-success mb-3 btn-sm' onclick='sendMode(\""+ name + "\")'><i class='fas fa-paper-plane'></i></button>";
		//divPanel.innerHTML += "<button type='button' id='heat_button_"+ name +"' class='btn btn-danger mb-3 btn-sm' onclick='heatingMode(\""+ name + "\")'><i class='fas fa-fire-alt'></i></button>";
		//divPanel.innerHTML += "<div class='row'><input type='number' class='mb-3' id='setTemp"+name+"' value='"+ temperature[i] +"' disabled/>";
		//divPanel.innerHTML += "<div class='row'><button type='button' class='btn btn-dark mb-3 btn-sm' onclick='setTemp(\""+ name + "\")' id='tempBtn"+name+"' disabled>OK</button></div>";
		
		var html = [
			'<div class="card mb-5">',
				'<img src="' + picture + '" alt="Une photo de chalet" class="card-img-top" style="height: 200px"/>',
				'<div class="card-body">',
					'<h5 class="card-title">'+ pseudo + " / " + location +'</h5>',
					'<p class="card-text" style="text-align:justify; height: 175px;">' + description + '</p>',
				'</div>',				
				'<ul class="list-group list-group-flush">',
					'<li class="list-group-item d-grid gap-2 d-flex justify-content-md-center align-items-center">',
						'<button class="btn btn-dark btn-lg" data-bs-toggle="modal" data-bs-target="#exampleModal" onclick="getDataPanel(\''+ name + '\')" data-bs-whatever="' + pseudo + '">Production '+ pseudo + '</button></li>',
					'</li>',
					'<li class="list-group-item d-grid gap-2 d-md-flex align-items-center justify-content-md-center">',
						'<button type="button" id="tracker_button_'+ name +'" class="btn btn-success btn-lg" onclick="trackerMode(\''+ name + '\')">',
							'<i class="fas fa-solar-panel"></i>',
						'</button>', 
						'<button type="button" id="send_button_'+ name +'" class="btn btn-success btn-lg" onclick="sendMode(\''+ name + '\')">',
							'<i class="fas fa-paper-plane"></i>',
						'</button>',
						'<button type="button" id="init_button_'+ name +'" class="btn btn-success btn-lg" onclick="init(\''+ name + '\')">',
							'<i class="fas fa-undo"></i>',
						'</button>',
					'</li>',
					'<li class="list-group-item d-grid gap-2 d-md-flex justify-content-md-center">',
						'<button type="button" id="heat_button_'+ name +'" class="btn btn-success btn-lg" onclick="heatingMode(\''+ name + '\')">',
							'<i class="fas fa-fire-alt"></i>',
						'</button>',
						'<input type="number" class="form-control" id="setTemp'+name+'" value="'+ temperature[i] +'" disabled/>',
						'<button type="button" class="btn btn-dark btn-lg" onclick="setTemp(\'' + name + '\')" id="tempBtn' + name + '" disabled>OK</button>',
					'</li>',
				'</ul>',
			'</div>'
		].join('');
		
		divPanel.innerHTML += html;
		document.getElementById("groupButtons").appendChild(divPanel);
		};
};


// Dessine le graphique de production totale
function drawChart(name, data){
	var names = [];
	var total = [];
	
	for(var i = 0; i < data.length; i++) {
		names[i] = data[i].pseudo + ' - ' + data[i].location;
		total[i] = data[i].total;
	};
	
	// Initialise une instance ECharts dans la <div> "main"
	var myChart = echarts.init(document.getElementById('main'));
	
	// Configuration du graphique et insertion des données
	var option = {
		title: {
			text: name
		},
		tooltip: {
			confine: true,
		},
		legend: {
			data:['Production']
		},
		xAxis: {
			data: names,
			fontWeight: 'bold'
		},
		yAxis: {
			name: 'kW/h',
			nameLocation: 'start',
			fontWeight: 'bold'
		},
		series: [{
			name: 'Production totale',
			type: 'bar',
			data: total,
			color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
				offset: 0,
				color: '#008080'
			}, {
				offset: 1,
				color: '#FFFFFF'
			}])
		}]
	};
	
	// Ajoute la configuration à l'instance d'ECharts
	myChart.setOption(option);
};

// Dessine le graphique de production par panneau
function drawChartPanel(name, data){
	
	//console.log(data);
	var dates = [];
	var values = [];
	
	for(var i = 0; i < data.length; i++) {
		dates[i] = new Date(data[i].date).toLocaleTimeString();
		values[i] = data[i].production; 
	};
	
	// Initialise une instance ECharts dans la <div> "panelProductionChart"
	var myChart = echarts.init(document.getElementById('panelProductionChart'));
	// Force le graphique à prendre une largeur de 1100px (obligatoire pour être affiché correctement dans la fenêtre modale !)
	myChart.resize({'width': '1100px'});
	
	// Configuration du graphique et insertion des données
	var option = {
		title: {
			text: name
		},
		tooltip: {},
		legend: {
			data:['Production']
		},
		xAxis: {
			data: dates
		},
		yAxis: {},
		series: [{
			name: 'Production',
			type: 'line',
			smooth: 'true',
			data: values,
			color: '#008080',
		areaStyle: {
                opacity: 0.8,
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
                    offset: 0,
                    color: '#008080'
                }, {
                    offset: 1,
                    color: '#FFFFFF'
                }])
            }
         }]
	};
	
	// Ajoute la configuration à l'instance d'ECharts
	myChart.setOption(option);
	
	// Modifie le titre de la fenêtre modale pour afficher le nom du panneau
	var modalTitle = document.getElementById('exampleModal').querySelector('.modal-title');
	modalTitle.textContent = 'Production de : ' + name;
};


// Envoi de données à l'Arduino

// Appelle la route qui envoie une trame à l'arduino pour activer/désactiver le suivi du soleil
function trackerMode(id) {
	axios.get('/api/trackermode/'+id).then(function(response) {
		document.getElementById("tracker_button_"+id).className = document.getElementById("tracker_button_"+id).className == 'btn btn-success btn-lg' ? 'btn btn-danger btn-lg' : 'btn btn-success btn-lg';
		console.log("tracker mode set")
	});
};

// Appelle la route qui envoie une trame à l'arduino pour activer/désactiver l'envoi de données par l'Arduino
function sendMode(id) {
	document.getElementById("send_button_"+id).className = document.getElementById("send_button_"+id).className == 'btn btn-success btn-lg' ? 'btn btn-danger btn-lg' : 'btn btn-success btn-lg';
	
	axios.get('/api/sendmode/'+id).then(function(response) {
		console.log("send mode set")
	});
};

// Appelle la route qui envoie une trame à l'arduino pour initialiser le panneau
function init(id) {
	
	axios.get('/api/init/'+id).then(function(response) {
		console.log("init set")
	});
};

// Appelle la route qui envoie une trame à l'arduino pour activer/désactiver le relais qui allume le chauffage
function heatingMode(id) {
	document.getElementById("setTemp"+id).disabled = !document.getElementById("setTemp"+id).disabled;
	document.getElementById("tempBtn"+id).disabled = !document.getElementById("tempBtn"+id).disabled;
	document.getElementById("heat_button_"+id).className = document.getElementById("heat_button_"+id).className == 'btn btn-success mb-3 btn-sm' ? 'btn btn-danger mb-3 btn-sm' : 'btn btn-success mb-3 btn-sm';
	
	axios.get('/api/heatingMode/'+id).then(function(response) {
		console.log("heating mode set")
	});
};

// Appelle la route qui envoie une trame à l'arduino pour modifier la température
function setTemp(name) {
	temp =  document.getElementById("setTemp"+name).value;
	
	console.log('/api/settemp/'+name+'/'+temp);
	axios.get('/api/settemp/'+name+'/'+temp).then(function(response) {
		console.log(response['data'])
	});
};

getData();
getListPanel();

// Force le rafraichissement des données du graphique de production totale
setInterval(getData, 10000);

