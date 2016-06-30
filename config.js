var config;

if (process.env.NODE_ENV === 'development') {
	config = {
		port: 3000,
		domain: 'http://localhost/'
	}
} else {
	config = {
		port: 80,
		domain: 'http://merge.prototypo.io/'
	}
}

module.exports = config;
