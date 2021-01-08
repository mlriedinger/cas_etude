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
		console.log(response['data'])
	})

}

function getListPanel() {
		axios.get('/api/list').then(function(response) {
			console.log(response['data'])
			for(var i = 0; i < response['data'].length; i++) {
				var name = response['data'][i].name;
				document.getElementById("panels").innerHTML += "<button onclick='getDataPanel(\""+ name + "\")'>"+ name + "</button>";
			}
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
			name: 'Sales',
			type: 'bar',
			data: total
		}]
	};
	// use configuration item and data specified to show chart
	myChart.setOption(option);
}

getData();
getListPanel();


setInterval(getData, 10000);

