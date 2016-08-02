var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var fs = require('fs');
var exec = require('child_process').exec;
var cors = require('cors');
var config = require('./config.js');
var routes = require('./routes.js');
var compression = require('compression');
var slug = require('slug');

var slugOptions = {
	remove: /[0-9,\.,_,-]/g,
}

var outputDir = config.outputDir;
var tempDir = config.tempDir;

// set routes
routes.setRoutes(app);

// add cross origin authorizations
app.use(cors({
	origin: config.corsOrigin,
}));

// enable gzip compressoin
app.use(compression());

app.post('/:font/:user',bodyParser.raw({type:'application/otf'}), function(req, res) {

	var fileName = req.params.user + '_' + req.params.font + (new Date()).getTime();
	fs.writeFile(tempDir + fileName + '.otf',req.body,
		function(err) {

			exec('./removeOverlap.pe ' + fileName + '.otf', function(err) {
				if (err) {
					console.log('Error while converting font with fileName: '+ fileName + err.message);
					fs.unlinkSync(tempDir + fileName + '.otf');
					return res.sendStatus(500);
				}

				res.download(outputDir + fileName + '.otf', function() {
					console.log('Successfully converted font with fileName: '+ fileName);
					//fs.unlinkSync(outputDir + fileName + '.otf');
					//fs.unlinkSync(tempDir + fileName + '.otf');
				});
			});
		});
});

app.post('/:fontFam/:fontStyle/:user', bodyParser.raw({type:'application/otf'}), handleDownloadPostRequest);
app.post('/:fontFam/:fontStyle/:user/:template', bodyParser.raw({type:'application/otf'}), handleDownloadPostRequest);
app.post('/:fontFam/:fontStyle/:user/:template/:overlap', bodyParser.raw({type:'application/otf'}), handleDownloadPostRequest);

var server = app.listen(config.port, function() {
	console.log('listening on port ' + config.port);
});

/**
*	Handle Dowload Request
* Will output a font file on the server and start the download
* file name structure : user_fontName_template_id
* @param {object} - the request
* @param {object} - the response
*/
function handleDownloadPostRequest(req, res) {
	// build file name
	var fileName = req.params.user +
		'_' + slug(req.params.fontFam, slugOptions) +
		'-' + slug(req.params.fontStyle, slugOptions);

	// add template to the file name
	if (req.params.template) {
		fileName += '_' + req.params.template;
	}

	// add a timestamp-based id the the file name
	fileName += '_' + (new Date()).getTime();

	// the 'merged' button has been clicked
	// run the removeOverlap script
	if (req.params.overlap) {
		fs.writeFile(tempDir + fileName + '.otf',req.body, function(err) {
				exec('./removeOverlap.pe ' + fileName + '.otf', function(err) {
					if (err) {
						console.log('Error while converting font with fileName: '+ fileName + err.message);
						fs.unlinkSync(tempDir + fileName + '.otf');
						return res.sendStatus(500);
					}

					res.download(outputDir + fileName + '.otf', function() {
						console.log('Successfully converted font with fileName: '+ fileName);
						fs.unlinkSync(tempDir + fileName + '.otf');
					});
				});
		});
	} else {
		fs.writeFile(outputDir + fileName + '.otf',req.body, function(err) {
			if(err) {
				console.log('Error while downloading font with fileName: ' + fileName + err.message);
			}

			console.log('Successfully downloaded font with fileName: ' + fileName);
			res.download(outputDir + fileName + '.otf');
		});
	}

}
