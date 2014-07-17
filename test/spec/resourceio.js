'use strict';
/*global describe, it, before, after, beforeEach, afterEach */
var debug = require('debug')('resourceio-test');
var expect = require('chai').expect;
var supertest = require('supertest');

var http = require('http');
var SockjsClient = require('node-sockjs-client');

describe('Api Express routing', function(){
	var app, httpServer, ioClient;

	before(function(done){
		var testCase = this;
		var apiexpress = require(__dirname + '/../../')();
		
		apiexpress.useSpec({
			specType:'swagger',
			specDir: __dirname + '/../fixtures/swagger'
		});
		
		apiexpress.action('sayHello', function(command, done){
			command.response = 'hello world';
			done();
		});

		apiexpress.action('sayHello').post(function(command, done){
			command.api.resourceio.publish('sayHello', command.response);
			done();
		});

		app = require('express')();
		app.use(apiexpress.http.router);
		var port = testCase.port = process.env.PORT || 3030;
		httpServer = http.createServer(app);
		httpServer.listen(port, function(){
			debug('Express server listening on port ' + port);
			done();
		});
		apiexpress.resourceio.attach(httpServer);
	});
	
	after(function(done){
		httpServer.close(function(){
			debug('server closed');
			done();
		});
	});

	beforeEach(function(done){
		ioClient = this.ioClient = new SockjsClient('http://localhost:'+ this.port + '/resourceio');
		ioClient.onopen = function(){
			debug('ioClient started');
			done();
		};
	});
	
	afterEach(function(done){
		ioClient.onclose = function(){
			debug('ioClient closed');
			done();
		};
		ioClient.close();
	});

	it('Broadcasts change notifications', function(done){
		ioClient.onmessage = function(e){
			var message = JSON.parse(e.data);
			console.log(message);
			expect(message).to.have.property('topic', 'sayHello');
			expect(message).to.have.property('payload', 'hello world');
			done();
		};

		supertest(app)
		.get('/hello')
		.expect(200)
		.end(function(err){
			if(err){done(err);}
		});
	});
});