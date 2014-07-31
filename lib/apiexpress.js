var debug = require('debug')('apiexpress');
var _ = require('lodash');
var HandlerStack = require('./handlerstack');
var Action = require('./action');

var ResourceIO = require('./resourceio');

var express = require('express');

var specRouters = {
	swagger:require('./rest-spec/swagger')
};

function ApiExpress(){
	var self = this;

	self._actions = {};

	self.http = new HandlerStack(function(req, res, next){
		self.router(req, res, next);
	});
	
	self.http.router = express.Router();
	self.resourceio = new ResourceIO();
}

/**
 * set or retrieve an action for this api
 * @return {[type]} [description]
 */
/**
 * Creates or retrieves an action
 * @param  {string|object} id - A unique identifier for the action or a map of actions
 * @param  {function|Action} [action] - the action to be performed
 * @return {Action}        The Action object or map of action objects
 */
ApiExpress.prototype.action = function(id, action){
	var self = this;
	if(!id){
		throw new Error('actions should have a unique identifiers');
	}
	
	if(typeof id === 'object'){
		return _.mapValues(id, function(a, i){
			return self.action(i, a);
		});
	}
	else if(typeof  id === 'string'){
		if(!action){
			return this._actions[id];
		}
		else if(typeof action === 'function'){
			action = new Action(id, action);
			this._actions[id] = action;
			return action;
		}
		else if(action instanceof Action){
			this._actions[id] = action;
			return action;
		}
		else{
			throw new Error('Invalid action type. Function or Action instance expected');
		}
	}
	else{
		throw new Error('Invalid "id" argument. String or Object expected');
	}
};

ApiExpress.prototype.useSpec = function(options){
	debug('resting from spec %s spec', options.specType);

	var specRouter = specRouters[options.specType];
	if(!specRouter){
		throw new Error('ApiExpress does not support %s spec'+ options.specType);
	}
	
	specRouter(options, this);
};

module.exports = function(){
	return new ApiExpress();
};

module.exports.Action = Action;