var request = require('request');

function nextId() { return new Date().getTime(); }

var workspaceName = "js-" + nextId();

console.error(workspaceName);

var baseUrl = 'http://198.199.105.97:8080';
var recipeLocation = 'https://gist.githubusercontent.com/freewind/bd27c65604cf072c8979/raw/ce12aa30ab87b497e7a6bd52ea84a4fb8ab02fa7/js_frontend.txt';
var templateProjectGitUrl = 'https://github.com/freewind/js_homework1.git';
var projectName = "js_homework1"
var ram = 128;

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
						ram: ram
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
				request.post(baseUrl + '/api/ext/project/' + workspaceId + '/import/' + projectName, {
					json: true,
					body: {
						"location": templateProjectGitUrl,
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

						request.get(baseUrl + '/api/ext/project/' + workspaceId, function(err, res, body) {
							console.log("---------- open project url in browse: ------------");

							if(err) return console.error("error: " + err);
							if(res.statusCode!=200) return console.warn("invalid status code: " + res.statusCode);

							console.log(baseUrl + "/ide/" + workspaceName);
						})
						
					});
				});
			}, 30000);
		});
	})
});


