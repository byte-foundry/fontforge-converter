var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var fs = require('fs');
var exec = require('child_process').exec;

app.post('/:user/:font',bodyParser.raw({type:'application/otf'}), function(req, res) {

	var fileName = req.params.user + '_' + req.params.font + (new Date()).getTime();
	fs.writeFile('tmp/' + fileName + '.otf',req.body,
		function(err) {

			exec('./removeOverlap.pe ' + fileName + '.otf', function(err) {
				if (err) {
					fs.unlinkSync('tmp/' + fileName + '.otf');
					return res.sendStatus(500);
				}

				res.download('output/' + fileName + '.otf', function() {
					fs.unlinkSync('output/' + fileName + '.otf');
					fs.unlinkSync('tmp/' + fileName + '.otf');
				});
			});
		});
});

var server = app.listen(3002, function() {
	console.log('listening');
});
