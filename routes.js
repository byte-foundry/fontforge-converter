var fs = require('fs');
var express = require('express');
var bodyParser = require('body-parser');
var bcrypt = require('bcrypt');
var session = require('express-session');

/**
* set route for the application
* @param {object} - the application
*/
var setRoutes = function(app){
	var OUTPUT_DIR = './output/';
	var DEFAULT_LIMIT = 50;
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
			displayFileList(req, res);
		}
	});
	app.get('/display/:length', function(req, res) {
		// redirect to login if no session
		if (!req.session.user) {
			res.redirect('login');
		} else {
			updateFileList(req, res);
		}
	});
	app.post('/display', function(req, res) {
		if (req.body.log_out) {
			req.session.user = undefined;
			res.redirect('/login');
		}
	});

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
		updateLimit += 20;

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
		return file.substring(0,file.indexOf('_'));
	}).filter(function(file, index, array) {
		// get rid of the duplicates
		return array.indexOf(file) === index;
	});

	return users;
}

exports.setRoutes = setRoutes;
