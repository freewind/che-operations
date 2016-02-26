var request = require('request-promise').defaults({ json: true });
var WebSocketClient = require('websocket').client;
var wsClient = new WebSocketClient();

function nextId() { return new Date().getTime(); }

function createCommands(options, workspaceId) {
	if(options.commands) {
		options.commands.forEach(function(cmd) {
			console.log("-------------------- create command ---------------");
			console.log(JSON.stringify(cmd));

			request.post(options.baseUrl + '/api/workspace/'+ workspaceId + '/command', {
				body: cmd
			})
			.then(function(body){
				console.log("-------------- command created ----------------");
				console.log(cmd);
			})
			.catch(function(err){
				console.error("Error: " + err);
			});
		})
	}
}

function importProject(options, workspaceId, workspaceName) {
	console.log('------------------- import project ----------------- ');
	request.post(options.baseUrl + '/api/ext/project/' + workspaceId + '/import/' + options.projectName, {
		body: {
			"location": options.templateProjectGitUrl,
			"parameters":{},
			"type":"git"
		}
	})
	.then(function() {
		console.log('--------------- get project information --------------');
		return request.get(options.baseUrl + '/api/ext/project/' + workspaceId);
	})
	.then(function(body) {
		console.log('--------------- all successful -------------------');
		console.log(JSON.stringify(body));
	})
	.then(function() {
		createCommands(options, workspaceId);
	})
	.then(function(){
		console.log("---------- open project url in browser ------------");
		console.log(options.baseUrl + "/ide/" + workspaceName);
	})
	.catch(function(err) {
		console.error('Error: ' + err);
	});
}

function checkWorkspaceStatusAndImportProject(options, workspaceId, workspaceName) {
	var wsUrl = options.wsBaseUrl + '/api/ws/' + workspaceId;
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
				importProject(options, workspaceId, workspaceName);
				connection.close();
			}
		});
	});
}

module.exports = function(options) {

	var workspaceName = options.workspacePrifix + "-" + nextId();

	console.log(workspaceName);

	console.log("------------------- login -----------------");

	request.post(options.baseUrl + '/api/auth/login')
	.then(function(body) {
		console.log(body);	
	})
	.then(function() {
		console.log("-------------- create workspace: ---------------");

		return request.post(options.baseUrl + '/api/workspace/config?account=', {
			body: {
				environments: [{
					name: workspaceName,
					recipe: null,
					machineConfigs: [{
						name: "ws-machine",
						limits: {
							ram: options.ram
						},
						type: "docker",
						source: {
							location: options.recipeLocation,
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
		return request.post(options.baseUrl + '/api/workspace/' + workspaceId + '/runtime?environment=' + workspaceName);
	})
	.then(function(body) {
		console.log(JSON.stringify(body));
		var workspaceId = body.id;
		console.log("workspaceId: " + workspaceId);
		checkWorkspaceStatusAndImportProject(options, workspaceId, workspaceName);
	})
	.catch(function(err) {
		console.error('error: ' + err);
		console.error(err.stack);
	});

}