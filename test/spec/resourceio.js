'use strict';
/*global describe, it, before, after, beforeEach, afterEach */
var debug = require('debug')('resourceio-test');
var expect = require('chai').expect;
var supertest = require('supertest');

var http = require('http');
var SockjsClient = require('node-sockjs-client');

describe('Api Express resource io', function(){
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

		apiexpress.action('createGreeting', function(command, done){
			command.response = {greeting:command.params.body, statusCode: 201};
			command.statusCode = 201;
			done();
		});

		apiexpress.action('createGreeting').post(function(command, done){
			command.api.resourceio.publishChange({topic:'/greetings', action:'create', data:command.params.body});
			done();
		});

		app = require('express')();
		var bodyParser = require('body-parser');
		// parse application/json and application/x-www-form-urlencoded
		app.use(bodyParser.urlencoded({extended:true}));
		app.use(bodyParser.json());
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

	it('Broadcasts change notifications for publishChange', function(done){
		ioClient.onmessage = function(e){
			var message = JSON.parse(e.data);
			expect(message).to.have.property('topic', '/greetings');
			expect(message).to.have.property('action', 'create');
			expect(message).to.have.property('data');
			expect(message.data).to.have.property('name', 'e k\'ale');
			done();
		};

		supertest(app)
		.post('/greetings')
		.send({name:'e k\'ale'})
		.set('Accept', 'application/json')
		.expect(201)
		.end(function(err){
			if(err){done(err);}
		});
	});
});