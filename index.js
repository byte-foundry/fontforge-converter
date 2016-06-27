var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var fs = require('fs');
var exec = require('child_process').exec;
var cors = require('cors');

app.use(cors({
	origin:['https://newui.prototypo.io','https://dev.prototypo.io','https://app.prototypo.io', 'http://localhost:9000', 'https://beta.prototypo.io']
}));

app.post('/:font/:user',bodyParser.raw({type:'application/otf'}), function(req, res) {

	var fileName = req.params.user + '_' + req.params.font + (new Date()).getTime();
	fs.writeFile('tmp/' + fileName + '.otf',req.body,
		function(err) {

			exec('./removeOverlap.pe ' + fileName + '.otf', function(err) {
				if (err) {
					console.log('Error while converting font with fileName: '+ fileName + err.message);
					fs.unlinkSync('tmp/' + fileName + '.otf');
					return res.sendStatus(500);
				}

				res.download('output/' + fileName + '.otf', function() {
					console.log('Successfully converted font with fileName: '+ fileName);
					//fs.unlinkSync('output/' + fileName + '.otf');
					//fs.unlinkSync('tmp/' + fileName + '.otf');
				});
			});
		});
});

app.post('/:fontFam/:fontStyle/:user',bodyParser.raw({type:'application/otf'}), function(req, res) {

	var fileName = req.params.user + '_' + req.params.fontFam + '-' + req.params.fontStyle + (new Date()).getTime();
	fs.writeFile('tmp/' + fileName + '.otf',req.body,
		function(err) {
			exec('./removeOverlap.pe ' + fileName + '.otf', function(err) {
				if (err) {
					console.log('Error while converting font with fileName: '+ fileName + err.message);
					fs.unlinkSync('tmp/' + fileName + '.otf');
					return res.sendStatus(500);
				}

				res.download('output/' + fileName + '.otf', function() {
					console.log('Successfully converted font with fileName: '+ fileName);
					fs.unlinkSync('tmp/' + fileName + '.otf');
				});
			});
		});
});

var server = app.listen(3000, function() {
	console.log('listening');
});
