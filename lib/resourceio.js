var EventEmitter = require('events').EventEmitter;
var util = require('util');
var sockjs = require('sockjs');

function ResourceIO (){
	var self = this;
	EventEmitter.call(self);
	self.connections = {};
	self.websocketServer = sockjs.createServer();
	self.websocketServer.on('connection', function(connection){
		self.connections[connection.address] = connection;
		connection.on('close', function(){
			delete self.connections[connection.address];
		});
	});
}

util.inherits(ResourceIO, EventEmitter);

ResourceIO.prototype.attach = function(server, options){
	var self = this;
	options = options || {};
	options.mountpoint = options.mountpoint || '/resourceio';
	options.prefix = options.mountpoint;
	self.websocketServer.installHandlers(server, options);
	self.emit('attached', server);
};

ResourceIO.prototype.publish = function(topic, data){
	var self = this;
	var message = {topic:topic, payload:data};
	message = JSON.stringify(message);
	Object.keys(self.connections).forEach(function(key){
		var conn = self.connections[key];
		conn.write(message);
	});
};

ResourceIO.prototype.publishChange = function(change){
	var self = this;
	var message = JSON.stringify(change);
	Object.keys(self.connections).forEach(function(key){
		var conn = self.connections[key];
		conn.write(message);
	});
};

module.exports = ResourceIO;