var createProject = require('./create-project');

createProject({
	workspacePrifix: 'js',
	baseUrl : 'http://198.199.105.97:8080',
	wsBaseUrl : 'ws://198.199.105.97:8080',
	recipeLocation : 'https://gist.githubusercontent.com/freewind/bd27c65604cf072c8979/raw/ce12aa30ab87b497e7a6bd52ea84a4fb8ab02fa7/js_frontend.txt',
	templateProjectGitUrl : 'https://github.com/freewind/js_homework1.git',
	projectName : "js_homework1",
	ram : 128
});