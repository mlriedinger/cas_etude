// Récupérer les données de production totale des panneaux et les afficher sous forme de graphique :

let dataPanels;

function getData() {
	axios.get('/api/panels')
	.then(function(response) {
		// console.log(response['data'])
		var data = response['data'];
		drawChart('Production totale des panneaux', data);
	})
}


// Récupérer les données de production d'un seul panneau et les afficher sous forme de graphique :

function getDataPanel(name) {
	//console.log(name);
	axios.get('/api/'+name).then(function(response) {
		drawChartPanel(name, response['data'])
	})

}


function getListPanel() {
	axios.get('/api/list').then(function(response) {
		// console.log(response['data'])
		dataPanels = response['data'];
		displayButtons();
	})
}


function displayButtons(){
	// console.log(dataPanels);
	
	for(var i = 0; i < dataPanels.length; i++) {
		var name = dataPanels[i].name;
		
		var divPanel = document.createElement("div");
		divPanel.classList.add("col");
		
		divPanel.innerHTML += "<button type='button' class='btn btn-dark' onclick='getDataPanel(\""+ name + "\")'>Production "+ name + "</button>"; 
		divPanel.innerHTML += "<button type='button' class='btn btn-dark' onclick='trackerMode(\""+ name + "\")'> Auto tracker mode</button>";
		divPanel.innerHTML += "<button type='button' class='btn btn-dark' onclick='sendMode(\""+ name + "\")'> Send data mode</button>";
		divPanel.innerHTML += "<button type='button' class='btn btn-dark' onclick='powerMode(\""+ name + "\")'> Heating mode</button>";
		divPanel.innerHTML += "<input type='number' id='setTemp"+name+"' value='20' disabled/>";
		divPanel.innerHTML += "<button type='button' class='btn btn-dark' onclick='setTemp(\""+ name + "\")' id='tempBtn"+name+"' disabled>OK</button>";
				
		document.getElementById("panels").appendChild(divPanel);
		}
}


function drawChart(name, data){
	// based on prepared DOM, initialize echarts instance
	
	var names = [];
	var total = [];
	
	for(var i = 0; i < data.length; i++) {
		
		names[i] = data[i].name;
		total[i] = data[i].total;
		
	}
	
	var myChart = echarts.init(document.getElementById('main'));
	// specify chart configuration item and data
	var option = {
		title: {
			text: name
		},
		tooltip: {},
		legend: {
			data:['Production']
		},
		xAxis: {
			data: names
		},
		yAxis: {},
		series: [{
			name: 'Production totale',
			type: 'bar',
			data: total,
			color: '#008080'
		}]
	};
	
	// use configuration item and data specified to show chart
	myChart.setOption(option);
}

function drawChartPanel(name, data){
	// based on prepared DOM, initialize echarts instance
	
	console.log(data);
	
	var dates = [];
	var values = [];
	
	for(var i = 0; i < data.length; i++) {
		
		dates[i] = new Date(data[i].date).toLocaleTimeString();
		values[i] = data[i].production; 
		
	}
	
	var myChart = echarts.init(document.getElementById('panelChart'));
	// specify chart configuration item and data
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
			data: values,
			color: '#008080'
		}]
	};
	
	// use configuration item and data specified to show chart
	myChart.setOption(option);
}


// Envoi de données à l'Arduino
// Appelle la route qui envoie une trame à l'arduino pour activer/désactiver le suivi du soleil

function trackerMode(id) {
	axios.get('/api/trackermode/'+id).then(function(response) {
		console.log("tracker mode set")
	})
}

// Appelle la route qui envoie une trame à l'arduino pour activer/désactiver l'envoi de données par l'Arduino

function sendMode(id) {
	axios.get('/api/sendmode/'+id).then(function(response) {
		console.log("send mode set")
	})
}

// Appelle la route qui envoie une trame à l'arduino pour activer/désactiver le relais qui allume le chauffage

function heatingMode(id) {
	
	document.getElementById("setTemp"+id).disabled = !document.getElementById("setTemp"+id).disabled;
	document.getElementById("tempBtn"+id).disabled = !document.getElementById("tempBtn"+id).disabled;
	
	axios.get('/api/heatingMode/'+id).then(function(response) {
		console.log("heating mode set")
	})
}


// Appelle la route qui envoie une trame à l'arduino pour modifier la température

function setTemp(name) {
	temp =  document.getElementById("setTemp"+name).value;
	
	console.log('/api/settemp/'+name+'/'+temp);
	axios.get('/api/settemp/'+name+'/'+temp).then(function(response) {
		console.log(response['data'])
	})
}

getData();
getListPanel();


setInterval(getData, 10000);

