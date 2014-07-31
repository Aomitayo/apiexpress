var debug = require('debug')('apiexpress.handlerstack');
var _ = require('lodash');

function HandlerStack(handler){
	this._pre = [];
	this._post = [];
	this._handlers = !!handler? Array.prototype.slice.call(arguments) : [];
}

HandlerStack.prototype.pre = function(fn){ this.use('pre', fn); return this;};

HandlerStack.prototype.post = function(fn){ this.use('post', fn); return this;};

HandlerStack.prototype.use = function(phase, fn){
	if(typeof phase === 'function' && !fn){
		fn = phase;
		phase = undefined;
	}
	if(typeof fn !== 'function'){
		throw new Error('HandlerStack middleware and handlers must be functions');
	}
	phase = phase || 'pre';
	this['_'+phase].push(fn);
};

/**
 * Runs the stack of handlers
 * The last argument should always be a callback function
 * @return {void} 
 */
HandlerStack.prototype.run = function(){
	var self = this;
	var label = Math.random() * (10000)+1000;
	
	if(!self._handlers || self._handlers.length === 0){
		throw new Error('HandlerStack must have at least one handler before running');
	}
	var done = _.last(arguments);
	done = typeof done === 'function'? done : _.noop;
	var args = _.initial(arguments);

	function runStack(stack, err){
		debug('%s %s', label, stack.length);
		if(err){
			debug('Stoping stack due to error %s', label);
			return done(err);
		}
		else if(stack.length === 0){
			debug('Stoping stack due to length %s', label);
			return done();
		}
		else{
			debug('Running stack %s', label, stack.length);
			_.head(stack).apply(self, args.concat(_.partial(runStack, _.tail(stack))));
		}
	}

	var thisStack = self._pre.concat(self._handlers, self._post);
	debug('%s', label, thisStack);

	runStack(thisStack);
};

module.exports = HandlerStack;