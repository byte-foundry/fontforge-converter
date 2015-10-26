var expect = require('chai').expect;
var request = require('supertest');
var fs = require('fs');

describe('Merging', function() {
	var url = 'http://localhost:3002';

	it('should convert my otf file', function(done) {
		fs.readFile('testFont-success.otf', function(err, data) {
			request(url)
				.post('/franz/pute')
				.set('Content-Type','application/otf')
				.send(data)
				.end(function(err, res) {
					var contentType = res.get('Content-type');
					expect(contentType).to.equal('font/opentype');
					var files = fs.readdirSync('tmp/');
					expect(files).to.have.length(0);
					done();
				});
		})
	});

	it('should return an error if my file is not an otf file', function(done) {
		fs.readFile('testFont-failure.otf', function(err, data) {
			request(url)
				.post('/franz/pute')
				.set('Content-Type','application/otf')
				.send(data)
				.end(function(err, res) {
					expect(res.status).to.equal(500);
					var files = fs.readdirSync('tmp/');
					expect(files).to.have.length(0);
					done();
				});
		})
	});
});
