'use strict';
/*global describe, it, before */

var expect = require('chai').expect;
var supertest = require('supertest');

describe('Api Express routing', function(){
	var app;
	before(function(){
		var apiexpress = require(__dirname + '/../../')();
		
		apiexpress.useSpec({
			specType:'swagger',
			specDir: __dirname + '/../fixtures/swagger'
		});
		
		apiexpress.action('sayHello', function(command, done){
			command.response = 'hello world';
			done();
		});

		apiexpress.action('helloPerson', function(command, done){
			command.response = 'hello ' + command.params.person;
			done();
		});

		app = require('express')();
		app.use(apiexpress.http.router);
		
	});	

	it('Routes http actions', function(done){
		supertest(app)
		.get('/hello')
		.expect(200)
		.end(function(err, res){
			expect(res.text).to.equal('hello world');
			done(err);
		});
	});

	it('routes http path parameters', function(done){
		supertest(app)
		.get('/hello/john')
		.expect(200)
		.end(function(err, res){
			expect(res.text).to.equal('hello john');
			done(err);
		});
	});
});