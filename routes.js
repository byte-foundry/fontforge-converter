/**
* set route for the application
* @param {object} - the application
*/
var setRoutes = function(app){
	var fs = require('fs');
	var OUTPUT_DIR = './output/';
	var DEFAULT_LIMIT = 50;
	var updateLimit = DEFAULT_LIMIT;

	// configure jade templating engine
	app.set('views','./src/views');
	app.set('view engine','jade');

	// configure '/display' routes
	app.get('/display', displayFileList);
	app.get('/display/:length', updateFileList);

	/**
	* Display file list
	* @param {object} - the request
	* @param {object} - the response
	*/
	function displayFileList(req, res) {
		fs.readdir(OUTPUT_DIR, function(err, files) {
			updateLimit = DEFAULT_LIMIT;

			if (err) {
				res.status(500).send(err.message);
				console.log(err.message);
			} else {
				var users = getUsers(files);
				var limit = Math.min(updateLimit, files.length);
				var limited = limit === updateLimit;
				var limitedFiles = files.slice(0,updateLimit);
				var limitedUsers = getUsers(limitedFiles);

				res.render('fontList', {
					title: 'Font listing',
					header1: 'Listing of "' + OUTPUT_DIR + '" directory',
					limit: limit,
					files: limited ? limitedFiles : files,
					users: limited ? limitedUsers : users,
					loadMore: (files.length - limit)
				});
			}
		});
	}

	/**
	* handle display request
	* @param {object} - the request
	* @param {object} - the response
	*/
	function updateFileList(req, res) {
		updateLimit += 2;

		fs.readdir(OUTPUT_DIR, function(err, files) {
			if (err) {
				res.status(500).send(err.message);
				console.log(err.message);
			} else {
				var users = getUsers(files);
				var limit = Math.min(updateLimit, files.length);
				var limited = limit === updateLimit;
				var limitedFiles = files.slice(0,updateLimit);
				var limitedUsers = getUsers(limitedFiles);

				res.send({
					limit: limit,
					files: limited ? limitedFiles : files,
					users: limited ? limitedUsers : users,
					loadMore: (files.length - limit)
				});
			}
		});
	}
}

/**
* get unique users from an array of filenames
* @param {array} - an array of string (filenames)
* @return {array} users - an array of unique usernames
*/
function getUsers(files) {
	var users = files.map(function(file) {
		// map each file to its substring before the first '_' (the user name)
		return file.substring(0,file.indexOf('_'));
	}).filter(function(file, index, array) {
		// get rid of the duplicates
		return array.indexOf(file) === index;
	});

	return users;
}

exports.setRoutes = setRoutes;
