var fs = require('fs');
var express = require('express');
var bodyParser = require('body-parser');
var bcrypt = require('bcrypt');
var moment = require('moment');
var session = require('express-session');
var config = require('./config.js');

/**
* set route for the application
* @param {object} - the application
*/
var setRoutes = function(app){
	var OUTPUT_DIR = './' + config.outputDir;
	var DEFAULT_LIMIT = 50;
	var LOAD_MORE = 20;
	var PASS_HASH = '$2a$10$42ZrBx35lxqyq9vndYYGBeqFEKCVvqNBfKXBPrBIY1yzpk5LBg5KS';
	var updateLimit = DEFAULT_LIMIT;
	var sessionSetup;

	// user urlencoded
	app.use(bodyParser.urlencoded({ extended: true }));

	// configure jade templating engine
	app.set('views','./src/views');
	app.set('view engine','jade');

	// configure sessions
	sessionSetup = {
	  secret: 'fontlist-output',
	  resave: false,
	  saveUninitialized: true
	}

	if (app.get('env') === 'production') {
	  sessionSetup.cookie.secure = true // serve secure cookies
	}
	app.use(session(sessionSetup));

	// set login route
	app.get('/login', function(req, res) {
		if (!req.session.user) {
			res.render('login', {
				title: 'Fontlist - Login',
				header1: 'Please log in'
			});
		} else {
			res.redirect('/display');
		}
	});
	app.post('/login', function(req, res) {
		if (req.body.login_password) {
			authenticate(req.body.login_password, PASS_HASH ,
				// success callback
				function() {
					req.session.user = 'authenticate';
					res.redirect('/display');
				// error callback
				}, function() {
					req.session.user = undefined;
					res.status(401).render('login', {
						title: 'Fontlist - Login',
						header1: 'Please log in',
						failed: true,
						errorMessage: 'Wrong password'
					});
				}
			);
		}
	});

	// set display route
	app.get('/display', function(req, res) {
		// redirect to login if no session
		if (!req.session.user) {
			res.redirect('login');
		} else {
			displayFileList(req, res, 'DISPLAY');
		}
	});
	app.get('/display/:length', function(req, res) {
		// redirect to login if no session
		if (!req.session.user) {
			res.redirect('login');
		} else {
			displayFileList(req, res, 'UPDATE');
		}
	});
	app.post('/display', function(req, res) {
		if (req.body.log_out) {
			req.session.user = undefined;
			res.redirect('/login');
		}
	});

	// set font access route
	app.get('/output/:font', function(req, res) {
		if (req.session.user) {
			if (req.params) {
				if (req.params.font) {
					fs.readFile(config.outputDir + req.params.font, function(err, data) {
						if (err) {
							res.status(404).end(err.message);
						} else {
							res.send(data);
						}
					});
				}
			}
		} else {
			res.status(403).end('Acces denied');
		}
	});

	/**
	* Display file list
	* @param {object} - the request
	* @param {object} - the response
	*/
	function displayFileList(req, res, action) {
		if (action === 'UPDATE') {
			updateLimit += LOAD_MORE;
		} else {
			updateLimit = DEFAULT_LIMIT;
		}

		fs.readdir(OUTPUT_DIR, function(err, files) {
			// get rid of the hidden files
			var files = files.filter(function(file) { return file.indexOf('.') !== 0 })
				.sort(function(a, b) {
					var aTokens = a.split('_');
					var bTokens = b.split('_');

					var aTimeWithExt = aTokens[aTokens.length - 1];
					var bTimeWithExt = bTokens[bTokens.length - 1];

					var aTime = aTimeWithExt.split('.')[0];
					var bTime = bTimeWithExt.split('.')[0];

					return bTime - aTime;
				})
				.map(function(file) {
					var fileTokens = file.split('_');
					return {
						file: file,
						familyStyle: fileTokens[1],
						user: fileTokens[0],
					};
				});

			if (err) {
				res.status(500).send(err.message);
				console.log(err.message);
			} else {
				var users = getUsers(files);
				var fontFamilies = getFontFamilies(files);
				var limit = Math.min(updateLimit, files.length);
				var limited = limit === updateLimit;
				var limitedFiles = files.slice(0, updateLimit);
				var limitedUsers = getUsers(limitedFiles);
				var limitedFontFamilies = getFontFamilies(limitedFiles);
				var remaining = files.length - limit;
				var loadMore = Math.min(remaining, LOAD_MORE);

				if (action === 'DISPLAY') {
					res.render('fontList', {
						title: 'Font listing',
						header1: 'Listing of "' + OUTPUT_DIR + '" directory',
						limit: limit,
						files: limited ? limitedFiles : files,
						users: limited ? limitedUsers : users,
						fontFamilies: limited ? limitedFontFamilies : fontFamilies,
						loadMore: loadMore,
						remaining: remaining
					});
				} else if (action === 'UPDATE') {
					res.send({
						limit: limit,
						files: limited ? limitedFiles : files,
						users: limited ? limitedUsers : users,
						fontFamilies: limited ? limitedFontFamilies : fontFamilies,
						loadMore: loadMore,
						remaining: remaining
					});
				} else {
					res.end('Error');
				}
			}
		});
	}


	/**
	* authenticate a user
	* @param {string} - the unhashed password
	* @param {function} - a callback function to execute when the check has been successful
	* @param {function} - a callback function to execute when the check has not been successful
	*/
	function authenticate(password, passHash, successCallback, errorCallback) {
		bcrypt.compare(password, passHash , function(err, res) {
			if (res) {
				return successCallback();
			} else {
				return errorCallback();
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
		return file.file.substring(0,file.file.indexOf('_'));
	}).filter(function(user, index, array) {
		// get rid of the duplicates and empty users
		return array.indexOf(user) === index && user !== '';
	});

	return users;
}

/**
* get fonts families from an array of filenames
* @param {array} - an array of string (filenames)
* @return {array} families - an array of unique usernames
*/
function getFontFamilies(files) {
	var families = files.filter(function(file, index, array) {
		// get rid of the duplicates
		return array.indexOf(file) === index;
	}).map(function(file) {
		var family = file.file.substring(file.file.indexOf('_')+1).replace(/(\.[A-z]*)$/g,'');
		return { family: family, file: file};
	});

	return families;
}

exports.setRoutes = setRoutes;
