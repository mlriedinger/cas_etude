function getData() {
	
	console.log("Hello ! Is it me you're looking foooooooor ?!");
	
	axios.get('/api/panels')
	.then(function(response) {
		console.log(response['data'])
		var data = response['data'];
		drawChart('Production totale des panneaux', data);
	})
}

function getDataPanel(name) {
	
	console.log(name);
	
	axios.get('/api/'+name).then(function(response) {
		drawChartPanel(name, response['data'])
	})

}

function getListPanel() {
		axios.get('/api/list').then(function(response) {
			console.log(response['data'])
			for(var i = 0; i < response['data'].length; i++) {
				var name = response['data'][i].name;
				document.getElementById("panels").innerHTML += "<button onclick='getDataPanel(\""+ name + "\")'>"+ name + "</button>";
				document.getElementById("panels").innerHTML += "<button onclick='trackerMode(\""+ name + "\")'> Tracker :"+ name + "</button>";
				document.getElementById("panels").innerHTML += "<button onclick='sendMode(\""+ name + "\")'> Send :"+ name + "</button>";
				document.getElementById("panels").innerHTML += "<button onclick='powerMode(\""+ name + "\")'> Power :"+ name + "</button>";
				document.getElementById("panels").innerHTML += "<input type='number' id='setTemp"+name+"' value='20' disabled/>";
				document.getElementById("panels").innerHTML += "<button onclick='setTemp(\""+ name + "\")' id='tempBtn"+name+"' disabled>Ok</button><br>";
				
			}
		})
}

function setTemp(name) {
		temp =  document.getElementById("setTemp"+name).value;
		
		console.log('/api/settemp/'+name+'/'+temp);
		axios.get('/api/settemp/'+name+'/'+temp).then(function(response) {
			console.log(response['data'])
		})
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

function trackerMode(id) {
	axios.get('/api/trackermode/'+id).then(function(response) {
		console.log("tracker mode set")
	})
}

function sendMode(id) {
	axios.get('/api/sendmode/'+id).then(function(response) {
		console.log("send mode set")
	})
}

function powerMode(id) {
	
	document.getElementById("setTemp"+id).disabled = !document.getElementById("setTemp"+id).disabled;
	document.getElementById("tempBtn"+id).disabled = !document.getElementById("tempBtn"+id).disabled;
	
	axios.get('/api/powermode/'+id).then(function(response) {
		console.log("power mode set")
	})
}

getData();
getListPanel();


setInterval(getData, 10000);

