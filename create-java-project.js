var createProject = require('./create-project');

createProject({
	workspacePrifix: 'java',
	baseUrl : 'http://198.199.105.97:8080',
	wsBaseUrl : 'ws://198.199.105.97:8080',
	recipeLocation : 'https://gist.githubusercontent.com/freewind/adb03cbbbd78d4f5379f/raw/91238a5a303567b6a60e36a63f0cc170b385ecc3/ubuntu_jdk8.txt',
	templateProjectGitUrl : 'https://github.com/che-samples/console-java-simple.git',
	projectName : "console-java-simple",
	ram : 1000,
	commands: [{
		name: 'build',
		type: 'mvn',
		commandLine: "mvn -f ${current.project.path} clean install"
	},
	{
		name: 'run',
		type: 'mvn',
		commandLine: "mvn -f ${current.project.path} clean install && java -jar ${current.project.path}/target/*.jar"
	}]
});

