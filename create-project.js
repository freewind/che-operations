var request = require('request');

function nextId() { return new Date().getTime(); }

var workspaceName = "wksp-" + nextId();

console.error(workspaceName);

var baseUrl = 'http://198.199.105.97:8080';
var recipeLocation = 'https://gist.githubusercontent.com/freewind/adb03cbbbd78d4f5379f/raw/6419e1d14bf4b62d32a9ce717644718eba51d8de/recipe.txt';



request.post(baseUrl + '/api/auth/login', function(err, res, body) {
	console.log("------------------- login OK: --------------");

	if(err) return console.error("error: " + err);
	if(res.statusCode!=200) return console.warn("invalid status code: " + res.statusCode);

	console.log(body);

	request.post(baseUrl + '/api/workspace/config?account=', {
		json: true,
		body: {
			environments: [{
				name: workspaceName,
				recipe: null,
				machineConfigs: [{
					name: "ws-machine",
					limits: {
						ram: 1000
					},
					type: "docker",
					source: {
						location: recipeLocation,
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
	}, function(err, res, body) {
		console.log("-------------- workspace created: ---------------");

		if(err) return console.error("error: " + err);
		if(res.statusCode!=201) return console.warn("invalid status code: " + res.statusCode);

		console.log(JSON.stringify(body));

		var workspaceId = body.id;
		console.log("workspaceId: " + workspaceId);

		request.post(baseUrl + '/api/workspace/' + workspaceId + '/runtime?environment=' + workspaceName, {
			json: true
		}, function(err, res, body) {
			console.log("-------------- workspace started: ---------------");

			if(err) return console.error("error: " + err);
			if(res.statusCode!=200) return console.warn("invalid status code: " + res.statusCode);

			console.log(JSON.stringify(body));

			setTimeout(function() {
				request.post(baseUrl + '/api/ext/project/' + workspaceId + '/import/console-java-simple', {
					json: true,
					body: {
						"location":"https://github.com/che-samples/console-java-simple.git",
						"parameters":{},
						"type":"git"
					}
				}, function(err, res, body) {
					console.log("-------------- project imported: ---------------");

					if(err) return console.error("error: " + err);
					if(res.statusCode!=204) return console.warn("invalid status code: " + res.statusCode);

					
					request.get(baseUrl + '/api/ext/project/' + workspaceId, function(err, res, body) {
						console.log("-------------- projects information: ---------------");

						if(err) return console.error("error: " + err);
						if(res.statusCode!=200) return console.warn("invalid status code: " + res.statusCode);

						console.log(JSON.stringify(body));

						["mvn -f ${current.project.path} clean install",
						"mvn -f ${current.project.path} clean install && java -jar ${current.project.path}/target/*.jar"].forEach(function(cmd) {
							request.post(baseUrl + '/api/workspace/'+workspaceId+'/command', {
								json: true,
								body: {
									"commandLine":cmd,
									"name":"console-java-simple: build",
									"type":"mvn",
									"attributes":{"previewUrl":""}
								}
							}, function(err, res, body) {
								console.log("-------------- command created: ----------------");

								if(err) return console.error("error: " + err);
								if(res.statusCode!=200) return console.warn("invalid status code: " + res.statusCode);
								console.log(cmd);

							})
						})

						request.put(baseUrl + '/api/ext/project/'+workspaceId + '/console-java-simple', {
							json: true,
							body: {
								"name": "console-java-simple",
								"description": "A hello world Java application.",
								"type": "maven",
								"commands": [{
									"commandLine": "mvn -f ${current.project.path} clean install",
									"name": "build",
									"type": "mvn",
									"attributes": {
										"previewUrl": ""
									}
								}, {
									"commandLine": "mvn -f ${current.project.path} clean install && java -jar ${current.project.path}/target/*.jar",
									"name": "run",
									"type": "mvn",
									"attributes": {
										"previewUrl": ""
									}
								}]
							}
						}, function(err, res, body) {
							console.log("----------- updated project commands: --------------");

							if(err) return console.error("error: " + err);
							if(res.statusCode!=200) return console.warn("invalid status code: " + res.statusCode);

							console.log(JSON.stringify(body));

							request.get(baseUrl + '/api/ext/project/' + workspaceId, function(err, res, body) {
								console.log("---------- open project url in browse: ------------");

								if(err) return console.error("error: " + err);
								if(res.statusCode!=200) return console.warn("invalid status code: " + res.statusCode);

								console.log(baseUrl + "/ide/" + workspaceName);
							})
						})
						
					});
				});
			}, 30000);
		});
	})
});



/*
request.post(baseUrl + '/api/auth/login')
.then(function(body) {
	console.log("login OK: " + body);
})
.then(function() {
	return request.post(baseUrl + '/api/workspace/config?account=', {
		json: true,
		body: {
			environments: [{
				name: workspaceName,
				recipe: null,
				machineConfigs: [{
					name: "ws-machine",
					limits: {
						ram: 1000
					},
					type: "docker",
					source: {
						location: recipeLocation,
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
	})
})
.then(function(body) {
	console.log("-------------- workspace created: ---------------");
	console.log(JSON.stringify(body));
	var workspaceId = body.id;
	console.log("workspaceId: " + workspaceId);
	return request.post(baseUrl + '/api/workspace/' + workspaceId + '/runtime?environment=' + workspaceName, {
		json: true
	});
})
.then(function(body) {
	console.log("-------------- workspace started: ---------------");
	console.log(JSON.stringify(body));
	return body.id;
})
.then(function(workspaceId) {
	return request.post(baseUrl + '/api/ext/project/' + workspaceId + '/import/console-java-simple', {
		json: true,
		body: {
			"location":"https://github.com/che-samples/console-java-simple.git",
			"parameters":{},
			"type":"git"
		}
	});
})
.then(function(body) {
	console.log("-------------- project imported: ---------------");
	console.log(JSON.stringify(body));
})
.catch(function (err) {
	console.error("error: " + err);
});

*/

