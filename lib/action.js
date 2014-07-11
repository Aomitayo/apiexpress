/**
 * A DSL for defining and handling actions
 */
var debug = require('debug')('apiexpress.action');
var _ = require('lodash');
var HandlerStack = require('./handlerstack');
var util = require('util');

function Action(name, actionHandler){
	var self = this;
	self.name = name;
	self.actionHandler = actionHandler;
	
	HandlerStack.call(this, function(){
		self.actionHandler.apply(self, arguments);
	});

	self.http = new HandlerStack(self.httpAdapter.bind(self));
}

util.inherits(Action, HandlerStack);

Action.prototype.httpAdapter = function(req, res, next){
	var self = this;
	
	//collect params "path", "query", "body", "header", "form"
	req.params = req.params || {};
	req.query = req.query || {};
	req.body = req.body || {};

	var command = {
		name: self.name,
		params: _.assign({}, req.params, req.query, {body: req.body}),
		http:{req: req, res:res},
		api: req.api
	};
	self.run(command, function(err){
		debug('%s action responding', self.name, command.response);
		if(err){
			return next(err);
		}
		else{
			//res.set('Content-Type', 'text/plain');
			res.send(command.statusCode || 200, command.response);
			//res.send(command.response);
		}
	});
};

module.exports = Action;