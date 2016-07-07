var config;

if (process.env.NODE_ENV === 'development') {
	config = {
		port: 3000,
		domain: 'http://localhost/',
		corsOrigin: ['http://localhost:9000']
	}
} else {
	config = {
		port: 80,
		domain: 'http://merge.prototypo.io/',
		corsOrigin: ['https://newui.prototypo.io','https://dev.prototypo.io','https://app.prototypo.io', 'https://beta.prototypo.io'],
	}
}

config.outputDir = 'output/';
config.tempDir = 'tmp/';

module.exports = config;
