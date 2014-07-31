/**
 * A DSL for defining and handling actions
 */
var debug = require('debug')('apiexpress.action');
var _ = require('lodash');
var HandlerStack = require('./handlerstack');
var util = require('util');

function Action(name, actionHandler){
	if(typeof name === 'function' && !actionHandler){
		actionHandler = name;
		name = undefined;
	}
	
	var self = this;
	self._name = name;
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
		name: self._name,
		params: _.assign({}, req.params, req.query, {body: req.body}),
		http:{req: req, res:res},
		api: req.api
	};
	self.run(command, function(err){
		if(err){
			debug('%s error ', self._name, err.errorId, err.info);
			return next(err);
		}
		else{
			debug('%s action responding', self._name, command.response);
			//res.set('Content-Type', 'text/plain');
			res.send(command.statusCode || 200, command.response);
			//res.send(command.response);
		}
	});
};

/**
 * Gets or sets the name of the action
 * @param  {String} val a name for the action
 * @return {String}     the name of the action
 */
Action.prototype.name = function(val){
	if(val){
		this._name = val;
	}
	return this._name;
};

module.exports = Action;