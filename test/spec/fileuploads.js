'use strict';
/*global describe, it, before */

var expect = require('chai').expect;
var supertest = require('supertest');
var fs = require('fs');

describe('Api Express routing', function(){
	var app;
	before(function(){
		var apiexpress = require(__dirname + '/../../')();
		
		apiexpress.useSpec({
			specType:'swagger',
			specDir: __dirname + '/../fixtures/swagger'
		});
		
		apiexpress.action('createGreeting', function(command, done){
			if(command.params.greetings){
				command.response = fs.readFileSync(command.params.greetings.path);
			}
			else{
				command.response = 'No Greeting file';
			}
			
			done();
		});

		app = require('express')();
		var multipart = require('connect-multiparty');
		app.use(multipart());
		app.use(apiexpress.http.router);
		
	});	

	it('Collects file parameters', function(done){
		supertest(app)
		.post('/greetings')
		.attach('greetings', __dirname +'/../fixtures/resources/greetings.txt')
		.expect(200)
		.end(function(err, res){
			expect(res.text).to.equal('this is a greetings text file');
			done(err);
		});
	});
});