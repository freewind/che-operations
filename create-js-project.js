var BASE_URL = 'http://198.199.105.97:8080';
var WS_BASE_URL = 'ws://198.199.105.97:8080'
var RECIPE_LOCATION = 'https://gist.githubusercontent.com/freewind/bd27c65604cf072c8979/raw/ce12aa30ab87b497e7a6bd52ea84a4fb8ab02fa7/js_frontend.txt';
var TEMPLATE_PROJECT_GIT_URL = 'https://github.com/freewind/js_homework1.git';
var PROJECT_NAME = "js_homework1"
var RAM = 128;

//---------------------------------------

var request = require('request-promise').defaults({ json: true });
var WebSocketClient = require('websocket').client;
var wsClient = new WebSocketClient();

function nextId() { return new Date().getTime(); }

var workspaceName = "js-" + nextId();

console.error(workspaceName);

function importProject(workspaceId) {
	console.log('------------------- import project ----------------- ');
	request.post(BASE_URL + '/api/ext/project/' + workspaceId + '/import/' + PROJECT_NAME, {
		body: {
			"location": TEMPLATE_PROJECT_GIT_URL,
			"parameters":{},
			"type":"git"
		}
	})
	.then(function() {
		console.log('--------------- get project information --------------');
		return request.get(BASE_URL + '/api/ext/project/' + workspaceId);
	})
	.then(function(body) {
		console.log(JSON.stringify(body));
	})
	.then(function(body){
		console.log("---------- open project url in browser ------------");
		console.log(BASE_URL + "/ide/" + workspaceName);
	})
	.catch(function(err) {
		console.error('Error: ' + err);
	});
}

function checkWorkspaceStatusAndImportProject(workspaceId) {
	var wsUrl = WS_BASE_URL + '/api/ws/' + workspaceId;
	console.log("Connect to: " + wsUrl);
	wsClient.connect(wsUrl);

	wsClient.on('connectFailed', function(error) {
		console.log('Connect Error: ' + error.toString());
	});

	wsClient.on('connect', function(connection) {
		console.log('WebSocket Client Connected');
		connection.sendUTF(JSON.stringify({
			"method": "POST",
			"headers": [{
				"name": "x-everrest-websocket-message-type",
				"value": "subscribe-channel"
			}],
			"body": "{\"channel\":\"workspace:"+workspaceId+"\"}"
		}));

		connection.on('error', function(error) {
			console.log("Connection Error: " + error.toString());
		});
		connection.on('close', function() {
			console.log('Connection Closed');
		});
		connection.on('message', function(message) {
			console.log("Received: " + message.utf8Data);
			var body = JSON.parse(JSON.parse(message.utf8Data).body);
			var eventType = body.eventType;
			console.log("EventType: " + eventType);

			if(eventType === 'ERROR') {
				console.error("Error occures when starting workspace");
				return;
			}
			if(eventType === "RUNNING") {
				importProject(workspaceId);
				connection.close();
			}
		});
	});
}

console.log("------------------- login: --------------");

request.post(BASE_URL + '/api/auth/login')
.then(function(body) {
	console.log(body);	
})
.then(function() {
	console.log("-------------- create workspace: ---------------");

	return request.post(BASE_URL + '/api/workspace/config?account=', {
		body: {
			environments: [{
				name: workspaceName,
				recipe: null,
				machineConfigs: [{
					name: "ws-machine",
					limits: {
						ram: RAM
					},
					type: "docker",
					source: {
						location: RECIPE_LOCATION,
						type: "recipe"
					},
					dev: true
				}]
			}],
			name: workspaceName,
			attributes: {},
			projects: [],
			defaultEnv: workspaceName,
			description: null,
			commands: [],
			links: []
		}
	});
})
.then(function(body) {
	console.log(JSON.stringify(body));
	var workspaceId = body.id;
	console.log("workspaceId: " + workspaceId);
	return workspaceId;
})
.then(function(workspaceId) {
	console.log("-------------- start workspace asynchronously ---------------")
	return request.post(BASE_URL + '/api/workspace/' + workspaceId + '/runtime?environment=' + workspaceName);
})
.then(function(body) {
	console.log(JSON.stringify(body));
	var workspaceId = body.id;
	console.log("workspaceId: " + workspaceId);
	checkWorkspaceStatusAndImportProject(workspaceId);
})
.catch(function(err) {
	console.error('error: ' + err);
	console.error(err.stack);
});
