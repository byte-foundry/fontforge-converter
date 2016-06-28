var setRoutes = function(app){
	var fs = require('fs');
	var OUTPUT_DIR = './output/';
	var DEFAULT_LIMIT = 50;

	app.set('views','./src/views');
	app.set('view engine','jade');

	app.get('/', function(req, res) {
		fs.readdir(OUTPUT_DIR, function(err, files) {
			if (err) {
				res.status(500).send(err.message);
				console.log(err.message);
			} else {
				var users = files.map(function(file) {
					return file.substring(0,file.indexOf('_'));
				}).filter(function(file, index, array) {
					return array.indexOf(file) === index;
				});
				res.render('fontList', {
					title: 'Font listing',
					header1: 'Listing of "' + OUTPUT_DIR + '" directory',
					list: files,
					users: users,
					limit: Math.min(DEFAULT_LIMIT, files.length)
				});
			}
		});
	});
}

exports.setRoutes = setRoutes;
